import express from 'express';
import * as BookingService from './booking.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import { 
    checkAvailabilitySchema, 
    preBookSchema, 
    createOrderSchema, 
    createRoomSchema,
    updateRoomSchema
} from './booking.validation';
import { isAdmin } from '../../shared/lib/utils/auth.middleware';

const router = express.Router();

// --- Public Routes ---

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

// FR 3.3: Cashfree Payment Gateway Integration
router.post('/payment/create-order', validate(createOrderSchema), async (req, res) => {
    const result = await BookingService.createOrder(req.body);
    res.status(200).json({ success: true, message: 'Payment order created.', data: result });
});

// FR 3.4: Payment Confirmation via Webhook
router.post('/payment/cashfree-webhook', async (req, res) => {
    // Note: Signature verification happens inside the service
    await BookingService.handleCashfreeWebhook(req.body, req.headers['x-webhook-signature'] as string);
    res.status(200).send({ status: 'success' }); // Acknowledge webhook
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
router.get('/admin/inventory/room-types', isAdmin, async (req, res) => {
    const rooms = await BookingService.getRoomInventory();
    res.status(200).json({ success: true, data: rooms });
});

// FR 3.6: Create a new room type
router.post('/admin/inventory/room-types', isAdmin, validate(createRoomSchema), async (req, res) => {
    const newRoom = await BookingService.createRoomType(req.body);
    res.status(201).json({ success: true, message: 'Room type created successfully.', data: newRoom });
});

// FR 3.6: Update an existing room type
router.put('/admin/inventory/room-types/:roomId', isAdmin, validate(updateRoomSchema), async (req, res) => {
    const updatedRoom = await BookingService.updateRoomType(req.params.roomId, req.body);
    res.status(200).json({ success: true, message: 'Room type updated successfully.', data: updatedRoom });
});

// FR 3.6: Deactivate a room type (logical delete)
router.delete('/admin/inventory/room-types/:roomId', isAdmin, async (req, res) => {
    const result = await BookingService.deleteRoomType(req.params.roomId);
    res.status(200).json({ success: true, message: 'Room type deactivated successfully.', data: result });
});

export default router;
