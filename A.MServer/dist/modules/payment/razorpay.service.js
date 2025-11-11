"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../shared/lib/db");
const client_1 = require("@prisma/client");
// Initialize Razorpay
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
class RazorpayService {
    async createOrder(request) {
        try {
            const { bookingId, amount, currency = 'INR', notes = {} } = request;
            // Create Razorpay order
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
                currency,
                receipt: `booking_${bookingId}`,
                notes: {
                    bookingId,
                    ...notes
                },
                payment_capture: true // Auto capture payment
            });
            // Update booking with order details
            await db_1.db.booking.update({
                where: { bookingId: bookingId },
                data: {
                    paymentOrderId: order.id,
                    paymentStatus: client_1.BookingPaymentStatus.Pending,
                }
            });
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
        catch (error) {
            console.error('Razorpay order creation failed:', error);
            throw new Error(error.message || 'Failed to create payment order');
        }
    }
    async verifyPayment(paymentId, orderId, signature) {
        const generatedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        if (generatedSignature !== signature) {
            throw new Error('Invalid payment signature');
        }
        try {
            // Verify payment details with Razorpay
            const payment = await razorpay.payments.fetch(paymentId);
            if (payment.status !== 'captured') {
                throw new Error('Payment not captured');
            }
            // Get booking ID from order notes
            const order = await razorpay.orders.fetch(orderId);
            const bookingId = order.notes?.bookingId;
            if (!bookingId) {
                throw new Error('Booking ID not found in order notes');
            }
            // Update booking status
            await db_1.db.booking.update({
                where: { bookingId },
                data: {
                    paymentStatus: client_1.BookingPaymentStatus.Success,
                    paymentId,
                    updatedAt: new Date()
                }
            });
            const paymentAmount = typeof payment.amount === 'number' ? payment.amount / 100 : 0;
            return {
                success: true,
                data: {
                    bookingId,
                    paymentId,
                    amount: paymentAmount,
                    status: payment.status
                }
            };
        }
        catch (error) {
            console.error('Payment verification failed:', error);
            throw new Error(error.message || 'Payment verification failed');
        }
    }
    async handleWebhook(payload, signature) {
        try {
            // Verify webhook signature
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (expectedSignature !== signature) {
                throw new Error('Invalid webhook signature');
            }
            const { event, payload: eventPayload } = payload;
            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(eventPayload.payment.entity);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(eventPayload.payment.entity);
                    break;
                // Add more event handlers as needed
            }
            return { success: true };
        }
        catch (error) {
            console.error('Webhook processing failed:', error);
            throw new Error(error.message || 'Webhook processing failed');
        }
    }
    async handlePaymentCaptured(payment) {
        const order = await razorpay.orders.fetch(payment.order_id);
        const bookingId = order.notes?.bookingId;
        if (!bookingId) {
            throw new Error('Booking ID not found in order notes');
        }
        await db_1.db.booking.update({
            where: { bookingId },
            data: {
                paymentStatus: client_1.BookingPaymentStatus.Success,
                paymentId: payment.id,
                updatedAt: new Date()
            }
        });
    }
    async handlePaymentFailed(payment) {
        const order = await razorpay.orders.fetch(payment.order_id);
        const bookingId = order.notes?.bookingId;
        if (!bookingId) {
            throw new Error('Booking ID not found in order notes');
        }
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
//# sourceMappingURL=razorpay.service.js.map