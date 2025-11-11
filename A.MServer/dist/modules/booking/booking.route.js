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
const auth_middleware_1 = require("../../shared/lib/utils/auth.middleware");
const roomImageUpload_1 = require("../../shared/lib/utils/roomImageUpload");
const razorpay_service_1 = require("../payment/razorpay.service");
const router = express_1.default.Router();
const razorpayService = new razorpay_service_1.RazorpayService();
// --- Public Routes ---
// FR 3.1: Check room availability
router.post('/check-availability', (0, validate_middleware_1.validate)(booking_validation_1.checkAvailabilitySchema), async (req, res) => {
    const result = await BookingService.checkAvailability(req.body);
    if (!result.isAvailable) {
        return res.status(409).json({ success: false, message: result.message, data: result });
    }
    res.status(200).json({ success: true, message: 'Rooms are available.', data: result });
});
// FR 3.2: Guest Information and Pre-Booking
router.post('/pre-book', (0, validate_middleware_1.validate)(booking_validation_1.preBookSchema), async (req, res) => {
    const result = await BookingService.preBook(req.body);
    res.status(201).json({ success: true, message: 'Booking initiated. Please proceed to payment.', data: result });
});
// FR 3.3: Razorpay Payment Gateway Integration
router.post('/payment/create-order', (0, validate_middleware_1.validate)(booking_validation_1.createOrderSchema), async (req, res) => {
    try {
        // First validate the booking
        const bookingData = await BookingService.createOrder(req.body);
        // Create Razorpay order
        const result = await razorpayService.createOrder({
            bookingId: bookingData.bookingId,
            amount: bookingData.amount,
            currency: bookingData.currency,
            notes: {
                guestName: bookingData.guestName,
                guestEmail: bookingData.guestEmail
            }
        });
        res.status(200).json({ success: true, message: 'Payment order created.', data: result.data });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// FR 3.4: Payment Confirmation via Razorpay Webhook
// NOTE: Razorpay webhooks are handled in /src/modules/payment/payment.route.ts
// This route is kept for backwards compatibility and logging
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
// Get final booking details by reference number
router.get('/:referenceNumber', async (req, res) => {
    const booking = await BookingService.getBookingByReference(req.params.referenceNumber);
    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    res.status(200).json({ success: true, data: booking });
});
// --- Admin Routes (Protected) ---
// FR 3.6: Get all room types and their rates
router.get('/admin/inventory/room-types', auth_middleware_1.isAdmin, async (req, res) => {
    const rooms = await BookingService.getRoomInventory();
    res.status(200).json({ success: true, data: rooms });
});
// FR 3.6: Create a new room type (with image upload)
// Note: multer `uploadRoomImage` populates req.body with strings (multipart/form-data).
// We must validate and coerce values before sending them to Prisma to avoid NaN/undefined errors.
router.post('/admin/inventory/room-types', auth_middleware_1.isAdmin, roomImageUpload_1.uploadRoomImage, async (req, res) => {
    try {
        const roomType = typeof req.body.roomType === 'string' ? req.body.roomType.trim() : '';
        // if (!roomType) {
        //     return res.status(400).json({ success: false, message: 'roomType is required.' });
        // }
        const totalRoomsRaw = req.body.totalRooms;
        const currentRateRaw = req.body.currentRate;
        const totalRooms = totalRoomsRaw !== undefined && totalRoomsRaw !== '' ? parseInt(totalRoomsRaw) : NaN;
        const currentRate = currentRateRaw !== undefined && currentRateRaw !== '' ? parseFloat(currentRateRaw) : NaN;
        if (Number.isNaN(totalRooms) || Number.isNaN(currentRate)) {
            return res.status(400).json({ success: false, message: 'totalRooms and currentRate are required and must be valid numbers.' });
        }
        const data = {
            roomType,
            totalRooms,
            currentRate,
            status: req.body.status || 'Active',
            description: req.body.description || undefined,
            imageUrl: req.file ? `/uploads/rooms/${req.file.filename}` : null,
        };
        const newRoom = await BookingService.createRoomType(data);
        res.status(201).json({ success: true, message: 'Room type created successfully.', data: newRoom });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// FR 3.6: Update an existing room type (with image upload)
router.put('/admin/inventory/room-types/:roomId', auth_middleware_1.isAdmin, roomImageUpload_1.uploadRoomImage, async (req, res) => {
    try {
        // Build update payload safely: only include fields that are present and valid
        const data = {};
        if (typeof req.body.roomType === 'string' && req.body.roomType.trim() !== '') {
            data.roomType = req.body.roomType.trim();
        }
        if (req.body.totalRooms !== undefined && req.body.totalRooms !== '') {
            const totalRooms = parseInt(req.body.totalRooms);
            if (!Number.isNaN(totalRooms))
                data.totalRooms = totalRooms;
        }
        if (req.body.currentRate !== undefined && req.body.currentRate !== '') {
            const currentRate = parseFloat(req.body.currentRate);
            if (!Number.isNaN(currentRate))
                data.currentRate = currentRate;
        }
        if (typeof req.body.status === 'string' && req.body.status.trim() !== '') {
            data.status = req.body.status;
        }
        if (typeof req.body.description === 'string') {
            data.description = req.body.description;
        }
        if (req.file) {
            data.imageUrl = `/uploads/rooms/${req.file.filename}`;
        }
        const updatedRoom = await BookingService.updateRoomType(req.params.roomId, data);
        res.status(200).json({ success: true, message: 'Room type updated successfully.', data: updatedRoom });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// FR 3.6: Deactivate a room type (logical delete)
router.delete('/admin/inventory/room-types/:roomId', auth_middleware_1.isAdmin, async (req, res) => {
    const result = await BookingService.deleteRoomType(req.params.roomId);
    res.status(200).json({ success: true, message: 'Room type deactivated successfully.', data: result });
});
// Admin: Get all bookings with filters
router.get('/admin/bookings', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const bookings = await BookingService.getAdminBookings({
            status: status,
            search: search,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.status(200).json({ success: true, data: bookings });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Get booking details
router.get('/admin/bookings/:bookingId', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const booking = await BookingService.getBookingDetailsAdmin(req.params.bookingId);
        res.status(200).json({ success: true, data: booking });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Update booking status
router.put('/admin/bookings/:bookingId/status', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await BookingService.updateBookingStatus(req.params.bookingId, status);
        res.status(200).json({ success: true, message: 'Booking status updated.', data: booking });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Get analytics
router.get('/admin/analytics', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const analytics = await BookingService.getAnalytics(period);
        res.status(200).json({ success: true, data: analytics });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Get revenue analytics
router.get('/admin/analytics/revenue', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const revenue = await BookingService.getRevenueAnalytics(period);
        res.status(200).json({ success: true, data: revenue });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Get occupancy stats
router.get('/admin/analytics/occupancy', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const occupancy = await BookingService.getOccupancyStats();
        res.status(200).json({ success: true, data: occupancy });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// Admin: Get top room types
router.get('/admin/analytics/top-rooms', auth_middleware_1.isAdmin, async (req, res) => {
    try {
        const topRooms = await BookingService.getTopRoomTypes();
        res.status(200).json({ success: true, data: topRooms });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=booking.route.js.map