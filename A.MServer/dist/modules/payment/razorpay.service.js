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
            const razor = this.ensureClient();
            const order = await razor.orders.create({
                amount: Math.round(amount * 100), // paise
                currency,
                receipt: `booking_${bookingId}`,
                notes: { bookingId, ...notes },
                payment_capture: true
            });
            try {
                await db_1.db.booking.update({
                    where: { bookingId },
                    data: {
                        paymentOrderId: order.id,
                        paymentStatus: client_1.BookingPaymentStatus.Pending,
                        updatedAt: new Date()
                    }
                });
            }
            catch (dbErr) {
                console.error('DB update after order creation failed:', dbErr);
                // Decide: attempt to cleanup or return partial success. Here we surface error to caller.
                return { success: false, message: 'Failed to link order with booking', error: dbErr.message };
            }
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
            // Return structured error rather than throwing raw error
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
     * handleWebhook expects rawBodyString (exact JSON string used by Razorpay to sign).
     * If you supply a Buffer or object, ensure you pass JSON.stringify(originalObject) or buffer.toString()
     */
    async handleWebhook(rawBodyString, signature) {
        if (!this.keySecret)
            throw new Error('Razorpay webhook secret not configured');
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(rawBodyString)
                .digest('hex');
            if (expectedSignature !== signature) {
                throw new Error('Invalid webhook signature');
            }
            const payload = JSON.parse(rawBodyString);
            const { event, payload: eventPayload } = payload;
            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(eventPayload.payment.entity);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(eventPayload.payment.entity);
                    break;
                default:
                    console.log('Unhandled webhook event:', event);
            }
            return { success: true };
        }
        catch (err) {
            console.error('Webhook processing failed:', err);
            throw new Error(err.message || 'Webhook processing failed');
        }
    }
    async handlePaymentCaptured(payment) {
        const razor = this.ensureClient();
        const order = await razor.orders.fetch(payment.order_id);
        const bookingId = order.notes?.bookingId;
        if (!bookingId)
            throw new Error('Booking ID not found in order notes');
        await markBookingAsPaid(bookingId, payment.id);
    }
    async handlePaymentFailed(payment) {
        const razor = this.ensureClient();
        const order = await razor.orders.fetch(payment.order_id);
        const bookingId = order.notes?.bookingId;
        if (!bookingId)
            throw new Error('Booking ID not found in order notes');
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
        console.warn(`Booking ${booking.bookingId} does not have an email address. Skipping confirmation email.`);
        return;
    }
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
    }
    catch (error) {
        console.error('Booking confirmation email failed:', error);
    }
}
//# sourceMappingURL=razorpay.service.js.map