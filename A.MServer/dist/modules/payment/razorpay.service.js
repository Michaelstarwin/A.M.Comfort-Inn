"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
// razorpay.service.ts (replace or adapt)
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const db_1 = require("../../shared/lib/db");
const sendEmail_1 = require("../../shared/lib/utils/sendEmail");
class RazorpayService {
    constructor() {
        this.razorpay = null;
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        this.keySecret = keySecret;
        if (!keyId || !keySecret) {
            console.error('Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in env.');
            // Keep razorpay null so any call will return a clear error instead of making malformed requests.
            this.razorpay = null;
        }
        else {
            this.razorpay = new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
        }
    }
    ensureClient() {
        if (!this.razorpay) {
            throw new Error('Payment gateway not configured on server.');
        }
        return this.razorpay;
    }
    async createOrder(request) {
        try {
            const { bookingId, amount, currency = 'INR', notes = {} } = request;
            // 1. Verify booking
            const existingBooking = await db_1.db.booking.findUnique({
                where: { bookingId },
                select: { paymentStatus: true, paymentOrderId: true }
            });
            if (!existingBooking) {
                return { success: false, message: 'Booking not found.' };
            }
            if (existingBooking.paymentStatus === client_1.BookingPaymentStatus.Success) {
                return { success: false, message: 'Booking is already paid.' };
            }
            // ✅ If order already exists, return it (idempotency)
            if (existingBooking.paymentOrderId) {
                console.log(`Order already exists for booking ${bookingId}: ${existingBooking.paymentOrderId}`);
                const razor = this.ensureClient();
                const existingOrder = await razor.orders.fetch(existingBooking.paymentOrderId);
                return {
                    success: true,
                    data: {
                        orderId: existingOrder.id,
                        amount: existingOrder.amount,
                        currency: existingOrder.currency,
                        receipt: existingOrder.receipt
                    }
                };
            }
            const razor = this.ensureClient();
            const amountInPaise = Math.round(amount * 100);
            const order = await razor.orders.create({
                amount: amountInPaise,
                currency,
                receipt: `booking_${bookingId}`,
                notes: { bookingId, ...notes },
                payment_capture: true
            });
            console.log(`✅ Razorpay order created: ${order.id} for booking: ${bookingId}`);
            // 2. ✅ ATOMICALLY update booking with orderId
            const updatedBooking = await db_1.db.booking.update({
                where: { bookingId },
                data: {
                    paymentOrderId: order.id,
                    paymentStatus: client_1.BookingPaymentStatus.Pending,
                    updatedAt: new Date()
                }
            });
            console.log(`✅ Booking ${bookingId} linked to order ${order.id}`);
            return {
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt
                }
            };
        }
        catch (err) {
            console.error('Razorpay order creation failed:', err);
            return { success: false, message: err.message || 'Failed to create payment order', detail: err };
        }
    }
    async verifyPayment(paymentId, orderId, signature) {
        if (!this.keySecret)
            throw new Error('Razorpay secret not configured');
        const generatedSignature = crypto_1.default
            .createHmac('sha256', this.keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        if (generatedSignature !== signature) {
            throw new Error('Invalid payment signature');
        }
        try {
            const razor = this.ensureClient();
            const payment = await razor.payments.fetch(paymentId);
            if (payment.status !== 'captured') {
                throw new Error('Payment not captured');
            }
            const order = await razor.orders.fetch(orderId);
            const bookingId = order.notes?.bookingId;
            if (!bookingId) {
                throw new Error('Booking ID not found in order notes');
            }
            const updatedBooking = await markBookingAsPaid(bookingId, paymentId);
            const paymentAmount = typeof payment.amount === 'number' ? payment.amount / 100 : 0;
            return {
                success: true,
                data: {
                    bookingId: updatedBooking.bookingId,
                    paymentId,
                    amount: paymentAmount,
                    status: payment.status
                }
            };
        }
        catch (err) {
            console.error('Payment verification failed:', err);
            throw new Error(err.message || 'Payment verification failed');
        }
    }
    /**
     * handleWebhook expects rawBody (Buffer) or string.
     * We use the raw bytes for signature verification to avoid parsing issues.
     */
    async handleWebhook(rawBody, signature) {
        if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
            throw new Error('Razorpay webhook secret not configured');
        }
        const bodyForVerification = Buffer.isBuffer(rawBody) ? rawBody : JSON.stringify(rawBody);
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(bodyForVerification)
                .digest('hex');
            console.log('[Webhook Debug] Received signature:', signature);
            console.log('[Webhook Debug] Expected signature:', expectedSignature);
            console.log('[Webhook Debug] Body type:', Buffer.isBuffer(rawBody) ? 'Buffer' : typeof rawBody);
            if (expectedSignature !== signature) {
                throw new Error('Invalid webhook signature');
            }
            const payload = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf8')) : rawBody;
            const { event, payload: eventPayload } = payload;
            console.log(`[Razorpay Webhook] ✅ Verified event: ${event}`);
            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(eventPayload.payment.entity);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(eventPayload.payment.entity);
                    break;
                default:
                    console.log('[Webhook] Unhandled event:', event);
            }
            return { success: true };
        }
        catch (err) {
            console.error('[Webhook] Processing failed:', err.message);
            throw err;
        }
    }
    async handlePaymentCaptured(payment) {
        const razor = this.ensureClient();
        // 1. Fetch order to get bookingId from notes
        // (Ideally, payment entity has notes too, but order notes are more reliable if payment notes were missed)
        let bookingId = payment.notes?.bookingId;
        if (!bookingId) {
            const order = await razor.orders.fetch(payment.order_id);
            bookingId = order.notes?.bookingId;
        }
        if (!bookingId) {
            console.error(`[Webhook] Booking ID missing for payment ${payment.id}`);
            return; // Can't do anything without booking ID
        }
        console.log(`[Webhook] Processing payment capture for Booking: ${bookingId}, Payment: ${payment.id}`);
        // 2. Idempotency & Update
        await markBookingAsPaid(bookingId, payment.id);
    }
    async handlePaymentFailed(payment) {
        let bookingId = payment.notes?.bookingId;
        if (!bookingId) {
            const razor = this.ensureClient();
            const order = await razor.orders.fetch(payment.order_id);
            bookingId = order.notes?.bookingId;
        }
        if (!bookingId)
            return;
        console.log(`[Webhook] Payment failed for Booking: ${bookingId}`);
        await db_1.db.booking.update({
            where: { bookingId },
            data: {
                paymentStatus: client_1.BookingPaymentStatus.Failed,
                paymentId: payment.id,
                updatedAt: new Date()
            }
        });
    }
}
exports.RazorpayService = RazorpayService;
async function markBookingAsPaid(bookingId, paymentId) {
    const existingBooking = await db_1.db.booking.findUnique({ where: { bookingId } });
    if (!existingBooking) {
        throw new Error('Booking not found for payment confirmation');
    }
    if (existingBooking.paymentStatus === client_1.BookingPaymentStatus.Success) {
        if (paymentId && !existingBooking.paymentId) {
            await db_1.db.booking.update({
                where: { bookingId },
                data: { paymentId }
            });
            existingBooking.paymentId = paymentId;
        }
        return existingBooking;
    }
    const updateData = {
        paymentStatus: client_1.BookingPaymentStatus.Success,
        updatedAt: new Date()
    };
    if (paymentId) {
        updateData.paymentId = paymentId;
    }
    const updatedBooking = await db_1.db.booking.update({
        where: { bookingId },
        data: updateData
    });
    await sendConfirmationEmail(updatedBooking);
    return updatedBooking;
}
async function sendConfirmationEmail(booking) {
    const guestInfo = booking.guestInfo;
    const recipient = guestInfo?.email;
    if (!recipient) {
        console.warn(`[Razorpay Service] Booking ${booking.bookingId} does not have an email address. Skipping confirmation email.`);
        return;
    }
    console.log(`[Razorpay Service] Preparing to send confirmation email to ${recipient} for booking ${booking.bookingId}`);
    const bookingDetails = {
        bookingId: booking.bookingId,
        checkInDate: booking.checkInDate.toISOString().split('T')[0],
        checkInTime: booking.checkInTime,
        checkOutDate: booking.checkOutDate.toISOString().split('T')[0],
        checkOutTime: booking.checkOutTime,
        roomType: booking.roomType,
        roomCount: booking.roomCount,
        totalAmount: booking.totalAmount,
        guestInfo,
    };
    try {
        await (0, sendEmail_1.sendBookingConfirmationEmail)(recipient, bookingDetails);
        console.log(`[Razorpay Service] Confirmation email sent successfully for booking ${booking.bookingId}`);
    }
    catch (error) {
        console.error(`[Razorpay Service] Booking confirmation email failed for booking ${booking.bookingId}:`, error);
    }
}
//# sourceMappingURL=razorpay.service.js.map