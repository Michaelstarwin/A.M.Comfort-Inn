import express from 'express';
import * as BookingService from './booking.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import {
  checkAvailabilitySchema,
  availabilityStatusSchema,
  preBookSchema,
  createOrderSchema
} from './booking.validation';
import { RazorpayService } from '../payment/razorpay.service';
import { db } from '../../shared/lib/db';
import adminRouter from './booking.admin.route';

const router = express.Router();
const razorpayService = new RazorpayService();

// Mount Admin Routes
// Requests to /api/bookings/admin/... will be handled by adminRouter
router.use('/admin', adminRouter);

// --- Public Routes ---

router.get('/availability/status', validate(availabilityStatusSchema), async (req, res) => {
  const { checkInDate, checkOutDate, checkInTime, checkOutTime } =
    req.query as Record<string, string | undefined>;

  try {
    const status = await BookingService.getAvailabilityStatus({
      checkInDate: checkInDate!,
      checkOutDate: checkOutDate!,
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
    });

    return res.status(200).json({ success: true, data: status });
  } catch (err: any) {
    console.error('Availability status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get availability status' });
  }
});

router.post('/check-availability', validate(checkAvailabilitySchema), async (req, res) => {
  const result = await BookingService.checkAvailability(req.body);
  if (!result.isAvailable) {
    return res.status(409).json({ success: false, message: result.message, data: result });
  }
  res.status(200).json({ success: true, message: 'Rooms are available.', data: result });
});

router.post('/pre-book', validate(preBookSchema), async (req, res) => {
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

  } catch (err: any) {
    console.error('Pre-book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create pre-booking' });
  }
});

router.post('/payment/create-order', async (req, res) => {
  try {
    // ✅ NEW FLOW: Check if request contains full booking data (new flow)
    const hasBookingData = req.body.checkInDate && req.body.guestInfo;

    if (hasBookingData) {
      // New flow: Create order with booking data in notes
      console.log('[create-order] New flow: Creating order with booking data');

      // Validate booking data
      const { createOrderWithBookingDataSchema } = await import('./booking.validation');
      const validationResult = createOrderWithBookingDataSchema.safeParse({ body: req.body });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking data',
          errors: validationResult.error.issues
        });
      }

      const bookingData = validationResult.data.body;

      // Check availability
      const availability = await BookingService.checkAvailability(bookingData);
      if (!availability.isAvailable) {
        return res.status(409).json({
          success: false,
          message: availability.message,
          data: availability
        });
      }

      // Create Razorpay order with booking data in notes
      const result = await razorpayService.createOrder({
        bookingId: `temp_${Date.now()}`, // Temporary ID for receipt
        amount: availability.totalAmount,
        currency: 'INR',
        notes: {
          bookingData: JSON.stringify(bookingData), // ✅ Store booking data in notes
          guestName: bookingData.guestInfo.fullName,
          guestEmail: bookingData.guestInfo.email
        }
      });

      if (!result || result.success === false || !result.data) {
        return res.status(400).json({
          success: false,
          message: result?.message || 'Failed to create payment order',
          detail: result
        });
      }

      console.log(`✅ Order ${result.data.orderId} created with booking data in notes`);

      return res.status(200).json({
        success: true,
        message: 'Payment order created.',
        data: result.data
      });
    }

    // OLD FLOW: Backward compatibility with bookingId
    const { createOrderSchema } = await import('./booking.validation');
    const validationResult = createOrderSchema.safeParse({ body: req.body });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: validationResult.error.issues
      });
    }

    const bookingData: any = await BookingService.createOrder(req.body);

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

    const linkedBooking = await db.booking.findUnique({
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
  } catch (error: any) {
    console.error('Create-order route error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
});

// ✅ CRITICAL: Put all specific routes BEFORE the generic catch-all routes

// Get all bookings (list view)
router.get('/', async (req, res) => {
  try {
    const bookings = await BookingService.getAllBookings();
    res.status(200).json({ success: true, data: bookings });
  } catch (error: any) {
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
  } catch (err: any) {
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
  } catch (err: any) {
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
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.status(200).json({ success: true, data: booking });
  } catch (err: any) {
    console.error('Get booking by reference error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking' });
  }
});

export default router;
