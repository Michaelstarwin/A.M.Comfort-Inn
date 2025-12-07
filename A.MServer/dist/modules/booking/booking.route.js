"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BookingService = __importStar(require("./booking.service"));
const validate_middleware_1 = require("../../shared/lib/utils/validate.middleware");
const booking_validation_1 = require("./booking.validation");
const razorpay_service_1 = require("../payment/razorpay.service");
const db_1 = require("../../shared/lib/db");
const booking_admin_route_1 = __importDefault(require("./booking.admin.route"));
const router = express_1.default.Router();
const razorpayService = new razorpay_service_1.RazorpayService();
// Mount Admin Routes
// Requests to /api/bookings/admin/... will be handled by adminRouter
router.use('/admin', booking_admin_route_1.default);
// --- Public Routes ---
router.get('/availability/status', (0, validate_middleware_1.validate)(booking_validation_1.availabilityStatusSchema), async (req, res) => {
    const { checkInDate, checkOutDate, checkInTime, checkOutTime } = req.query;
    try {
        const status = await BookingService.getAvailabilityStatus({
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            checkInTime: checkInTime,
            checkOutTime: checkOutTime,
        });
        return res.status(200).json({ success: true, data: status });
    }
    catch (err) {
        console.error('Availability status error:', err);
        return res.status(500).json({ success: false, message: 'Failed to get availability status' });
    }
});
router.post('/check-availability', (0, validate_middleware_1.validate)(booking_validation_1.checkAvailabilitySchema), async (req, res) => {
    const result = await BookingService.checkAvailability(req.body);
    if (!result.isAvailable) {
        return res.status(409).json({ success: false, message: result.message, data: result });
    }
    res.status(200).json({ success: true, message: 'Rooms are available.', data: result });
});
router.post('/pre-book', (0, validate_middleware_1.validate)(booking_validation_1.preBookSchema), async (req, res) => {
    try {
        const result = await BookingService.preBook(req.body);
        if (!result.success) {
            return res.status(409).json({
                success: false,
                message: result.message
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Booking initiated. Please proceed to payment.',
            data: result
        });
    }
    catch (err) {
        console.error('Pre-book error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create pre-booking' });
    }
});
router.post('/payment/create-order', (0, validate_middleware_1.validate)(booking_validation_1.createOrderSchema), async (req, res) => {
    try {
        const bookingData = await BookingService.createOrder(req.body);
        if (!bookingData || bookingData.success === false) {
            return res.status(400).json({ success: false, message: bookingData?.message || 'Invalid booking for payment' });
        }
        const result = await razorpayService.createOrder({
            bookingId: bookingData.bookingId,
            amount: bookingData.amount,
            currency: bookingData.currency,
            notes: {
                guestName: bookingData.guestName,
                guestEmail: bookingData.guestEmail
            }
        });
        if (!result || result.success === false || !result.data) {
            return res.status(400).json({ success: false, message: result?.message || 'Failed to create payment order', detail: result });
        }
        const linkedBooking = await db_1.db.booking.findUnique({
            where: { bookingId: bookingData.bookingId },
            select: { paymentOrderId: true }
        });
        if (!linkedBooking || linkedBooking.paymentOrderId !== result.data.orderId) {
            console.error('CRITICAL: Order linking verification failed', {
                bookingId: bookingData.bookingId,
                expectedOrderId: result.data.orderId,
                actualOrderId: linkedBooking?.paymentOrderId
            });
            return res.status(500).json({
                success: false,
                message: 'Payment order created but linking failed. Please try again.'
            });
        }
        console.log(`✅ Order ${result.data.orderId} successfully linked to booking ${bookingData.bookingId}`);
        return res.status(200).json({ success: true, message: 'Payment order created.', data: result.data });
    }
    catch (error) {
        console.error('Create-order route error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
    }
});
router.post('/payment/razorpay-webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        console.log("Razorpay webhook received and processed by payment service");
        res.status(200).json({ status: 'success', message: 'Webhook processed by payment service' });
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
});
// ✅ CRITICAL: Put all specific routes BEFORE the generic catch-all routes
// Get all bookings (list view)
router.get('/', async (req, res) => {
    try {
        const bookings = await BookingService.getAllBookings();
        res.status(200).json({ success: true, data: bookings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: error.message });
    }
});
// ✅ SPECIFIC ROUTE: Get booking by Razorpay order ID (MUST be before /:referenceNumber)
router.get('/order/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(`[ROUTE /order/:orderId] Fetching booking for orderId: ${orderId}`);
        const booking = await BookingService.getBookingByOrderId(orderId);
        if (!booking) {
            console.warn(`[ROUTE] No booking found for orderId: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: 'Booking not found for this order ID.'
            });
        }
        console.log(`[ROUTE] ✅ Successfully retrieved booking: ${booking.bookingId}`);
        return res.status(200).json({ success: true, data: booking });
    }
    catch (err) {
        console.error('[ROUTE /order/:orderId] Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve booking.'
        });
    }
});
// ✅ SPECIFIC ROUTE: Backward compatibility alias (MUST be before /:referenceNumber)
router.get('/payment-status/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(`[GET /payment-status/:orderId] Fetching booking for orderId: ${orderId}`);
        const booking = await BookingService.getBookingByOrderId(orderId);
        if (!booking) {
            console.warn(`[GET /payment-status/:orderId] ❌ No booking found in DB for orderId: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: 'Booking not found. Please check your email for confirmation or contact support.'
            });
        }
        return res.status(200).json({ success: true, data: booking });
    }
    catch (err) {
        console.error('[GET /payment-status/:orderId] Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve booking. Please try again later.'
        });
    }
});
// ⚠️ CATCH-ALL ROUTE: This MUST be LAST (it matches ANY single segment)
router.get('/:referenceNumber', async (req, res) => {
    try {
        const booking = await BookingService.getBookingByReference(req.params.referenceNumber);
        if (!booking)
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        return res.status(200).json({ success: true, data: booking });
    }
    catch (err) {
        console.error('Get booking by reference error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve booking' });
    }
});
exports.default = router;
//# sourceMappingURL=booking.route.js.map