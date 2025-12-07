import express from 'express';
import * as BookingService from './booking.service';
import { isAdmin } from '../../shared/lib/utils/auth.middleware';
import { uploadRoomImage } from '../../shared/lib/utils/roomImageUpload';

const router = express.Router();

// --- Admin Routes (Protected) ---

// FR 3.6: Get all room types and their rates
router.get('/inventory/room-types', isAdmin, async (req, res) => {
    const rooms = await BookingService.getRoomInventory();
    res.status(200).json({ success: true, data: rooms });
});

// FR 3.6: Create a new room type (with image upload)
// Note: multer `uploadRoomImage` populates req.body with strings (multipart/form-data).
// We must validate and coerce values before sending them to Prisma to avoid NaN/undefined errors.
router.post('/inventory/room-types', isAdmin, uploadRoomImage, async (req, res) => {
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
router.put('/inventory/room-types/:roomId', isAdmin, uploadRoomImage, async (req, res) => {
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
router.delete('/inventory/room-types/:roomId', isAdmin, async (req, res) => {
    const result = await BookingService.deleteRoomType(req.params.roomId);
    res.status(200).json({ success: true, message: 'Room type deactivated successfully.', data: result });
});

// Admin: Get all bookings with filters
router.get('/bookings', isAdmin, async (req, res) => {
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
router.get('/bookings/:bookingId', isAdmin, async (req, res) => {
    try {
        const booking = await BookingService.getBookingDetailsAdmin(req.params.bookingId);
        res.status(200).json({ success: true, data: booking });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Update booking status
router.put('/bookings/:bookingId/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await BookingService.updateBookingStatus(req.params.bookingId, status);
        res.status(200).json({ success: true, message: 'Booking status updated.', data: booking });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get analytics
router.get('/analytics', isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const analytics = await BookingService.getAnalytics(period as string);
        res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get revenue analytics
router.get('/analytics/revenue', isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const revenue = await BookingService.getRevenueAnalytics(period as string);
        res.status(200).json({ success: true, data: revenue });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get occupancy stats
router.get('/analytics/occupancy', isAdmin, async (req, res) => {
    try {
        const occupancy = await BookingService.getOccupancyStats();
        res.status(200).json({ success: true, data: occupancy });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin: Get top room types
router.get('/analytics/top-rooms', isAdmin, async (req, res) => {
    try {
        const topRooms = await BookingService.getTopRoomTypes();
        res.status(200).json({ success: true, data: topRooms });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
