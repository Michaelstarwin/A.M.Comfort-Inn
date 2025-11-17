import express from 'express';
import * as BookingService from './booking.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import {
    checkAvailabilitySchema,
    availabilityStatusSchema,
    preBookSchema,
    createOrderSchema,
    createRoomSchema,
    updateRoomSchema
} from './booking.validation';
import { isAdmin } from '../../shared/lib/utils/auth.middleware';
import { uploadRoomImage } from '../../shared/lib/utils/roomImageUpload';
import { RazorpayService } from '../payment/razorpay.service';

const router = express.Router();
const razorpayService = new RazorpayService();

// --- Public Routes ---

router.get('/availability/status', validate(availabilityStatusSchema), async (req, res) => {
    const { checkInDate, checkOutDate, checkInTime, checkOutTime } = req.query as Record<string, string | undefined>;

    const status = await BookingService.getAvailabilityStatus({
        checkInDate: checkInDate as string,
        checkOutDate: checkOutDate as string,
        checkInTime: checkInTime as string | undefined,
        checkOutTime: checkOutTime as string | undefined,
    });

    res.status(200).json({ success: true, data: status });
});

// FR 3.1: Check room availability
router.post('/check-availability', validate(checkAvailabilitySchema), async (req, res) => {
    const result = await BookingService.checkAvailability(req.body);
    if (!result.isAvailable) {
        return res.status(409).json({ success: false, message: result.message, data: result });
    }
    res.status(200).json({ success: true, message: 'Rooms are available.', data: result });
});

// FR 3.2: Guest Information and Pre-Booking
router.post('/pre-book', validate(preBookSchema), async (req, res) => {
    const result = await BookingService.preBook(req.body);
    res.status(201).json({ success: true, message: 'Booking initiated. Please proceed to payment.', data: result });
});

// FR 3.3: Razorpay Payment Gateway Integration
router.post('/payment/create-order', validate(createOrderSchema), async (req, res) => {
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
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// FR 3.4: Payment Confirmation via Razorpay Webhook
// NOTE: Razorpay webhooks are handled in /src/modules/payment/payment.route.ts
// This route is kept for backwards compatibility and logging
router.post('/payment/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        console.log("Razorpay webhook received and processed by payment service");
        res.status(200).json({ status: 'success', message: 'Webhook processed by payment service' });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// Public: Get all bookings (optional)
router.get('/', async (req, res) => {
  try {
    const bookings = await BookingService.getAllBookings(); // Service call
    res.status(200).json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: error.message });
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

router.get('/order/:orderId', async (req, res) => {
    const booking = await BookingService.getBookingByOrderId(req.params.orderId);
    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    res.status(200).json({ success: true, data: booking });
});


// --- Admin Routes (Protected) ---

// FR 3.6: Get all room types and their rates
router.get('/admin/inventory/room-types', isAdmin, async (req, res) => {
    const rooms = await BookingService.getRoomInventory();
    res.status(200).json({ success: true, data: rooms });
});

// FR 3.6: Create a new room type (with image upload)
// Note: multer `uploadRoomImage` populates req.body with strings (multipart/form-data).
// We must validate and coerce values before sending them to Prisma to avoid NaN/undefined errors.
router.post('/admin/inventory/room-types', isAdmin, uploadRoomImage, async (req, res) => {
    try {
        const roomType = typeof req.body.roomType === 'string' ? req.body.roomType.trim() : '';
        // if (!roomType) {
        //     return res.status(400).json({ success: false, message: 'roomType is required.' });
        // }

        const totalRoomsRaw = req.body.totalRooms;
        const currentRateRaw = req.body.currentRate;

        const totalRooms = totalRoomsRaw !== undefined && totalRoomsRaw !== '' ? parseInt(totalRoomsRaw as string) : NaN;
        const currentRate = currentRateRaw !== undefined && currentRateRaw !== '' ? parseFloat(currentRateRaw as string) : NaN;

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

        const newRoom = await BookingService.createRoomType(data as any);
        res.status(201).json({ success: true, message: 'Room type created successfully.', data: newRoom });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// FR 3.6: Update an existing room type (with image upload)
router.put('/admin/inventory/room-types/:roomId', isAdmin, uploadRoomImage, async (req, res) => {
    try {
        // Build update payload safely: only include fields that are present and valid
        const data: any = {};

        if (typeof req.body.roomType === 'string' && req.body.roomType.trim() !== '') {
            data.roomType = req.body.roomType.trim();
        }

        if (req.body.totalRooms !== undefined && req.body.totalRooms !== '') {
            const totalRooms = parseInt(req.body.totalRooms as string);
            if (!Number.isNaN(totalRooms)) data.totalRooms = totalRooms;
        }

        if (req.body.currentRate !== undefined && req.body.currentRate !== '') {
            const currentRate = parseFloat(req.body.currentRate as string);
            if (!Number.isNaN(currentRate)) data.currentRate = currentRate;
        }

        if (typeof req.body.status === 'string' && req.body.status.trim() !== '') {
            data.status = req.body.status as 'Active' | 'Inactive';
        }

        if (typeof req.body.description === 'string') {
            data.description = req.body.description;
        }

        if (req.file) {
            data.imageUrl = `/uploads/rooms/${req.file.filename}`;
        }

        const updatedRoom = await BookingService.updateRoomType(req.params.roomId, data);
        res.status(200).json({ success: true, message: 'Room type updated successfully.', data: updatedRoom });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// FR 3.6: Deactivate a room type (logical delete)
router.delete('/admin/inventory/room-types/:roomId', isAdmin, async (req, res) => {
    const result = await BookingService.deleteRoomType(req.params.roomId);
    res.status(200).json({ success: true, message: 'Room type deactivated successfully.', data: result });
});

// Admin: Get all bookings with filters
router.get('/admin/bookings', isAdmin, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const bookings = await BookingService.getAdminBookings({
            status: status as string,
            search: search as string,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        });
        res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get booking details
router.get('/admin/bookings/:bookingId', isAdmin, async (req, res) => {
    try {
        const booking = await BookingService.getBookingDetailsAdmin(req.params.bookingId);
        res.status(200).json({ success: true, data: booking });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Update booking status
router.put('/admin/bookings/:bookingId/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await BookingService.updateBookingStatus(req.params.bookingId, status);
        res.status(200).json({ success: true, message: 'Booking status updated.', data: booking });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get analytics
router.get('/admin/analytics', isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const analytics = await BookingService.getAnalytics(period as string);
        res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get revenue analytics
router.get('/admin/analytics/revenue', isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const revenue = await BookingService.getRevenueAnalytics(period as string);
        res.status(200).json({ success: true, data: revenue });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get occupancy stats
router.get('/admin/analytics/occupancy', isAdmin, async (req, res) => {
    try {
        const occupancy = await BookingService.getOccupancyStats();
        res.status(200).json({ success: true, data: occupancy });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get top room types
router.get('/admin/analytics/top-rooms', isAdmin, async (req, res) => {
    try {
        const topRooms = await BookingService.getTopRoomTypes();
        res.status(200).json({ success: true, data: topRooms });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
