// razorpay.service.ts (replace or adapt)
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Booking, BookingPaymentStatus, Prisma } from '@prisma/client';
import { db } from '../../shared/lib/db';
import { sendBookingConfirmationEmail } from '../../shared/lib/utils/sendEmail';

export interface CreateOrderRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  private razorpay: Razorpay | null = null;
  private keySecret: string | undefined;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.keySecret = keySecret;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in env.');
      // Keep razorpay null so any call will return a clear error instead of making malformed requests.
      this.razorpay = null;
    } else {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  private ensureClient() {
    if (!this.razorpay) {
      throw new Error('Payment gateway not configured on server.');
    }
    return this.razorpay;
  }

  async createOrder(request: CreateOrderRequest) {
    try {
      const { bookingId, amount, currency = 'INR', notes = {} } = request;

      const razor = this.ensureClient();

      const order = await razor.orders.create({
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: `booking_${bookingId}`,
        notes: { bookingId, ...notes },
        payment_capture: true
      }) as any;

      try {
        await db.booking.update({
          where: { bookingId },
          data: {
            paymentOrderId: order.id,
            paymentStatus: BookingPaymentStatus.Pending,
            updatedAt: new Date()
          }
        });
      } catch (dbErr: any) {
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
    } catch (err: any) {
      console.error('Razorpay order creation failed:', err);
      // Return structured error rather than throwing raw error
      return { success: false, message: err.message || 'Failed to create payment order', detail: err };
    }
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    if (!this.keySecret) throw new Error('Razorpay secret not configured');

    const generatedSignature = crypto
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
      const bookingId = order.notes?.bookingId as string | undefined;
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
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      throw new Error(err.message || 'Payment verification failed');
    }
  }

  /**
   * handleWebhook expects rawBodyString (exact JSON string used by Razorpay to sign).
   * If you supply a Buffer or object, ensure you pass JSON.stringify(originalObject) or buffer.toString()
   */
  async handleWebhook(rawBodyString: string, signature: string) {
    if (!this.keySecret) throw new Error('Razorpay webhook secret not configured');

    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
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
    } catch (err: any) {
      console.error('Webhook processing failed:', err);
      throw new Error(err.message || 'Webhook processing failed');
    }
  }

  private async handlePaymentCaptured(payment: any) {
    const razor = this.ensureClient();
    const order = await razor.orders.fetch(payment.order_id);
    const bookingId = order.notes?.bookingId as string | undefined;
    if (!bookingId) throw new Error('Booking ID not found in order notes');
    await markBookingAsPaid(bookingId, payment.id);
  }

  private async handlePaymentFailed(payment: any) {
    const razor = this.ensureClient();
    const order = await razor.orders.fetch(payment.order_id);
    const bookingId = order.notes?.bookingId as string | undefined;
    if (!bookingId) throw new Error('Booking ID not found in order notes');

    await db.booking.update({
      where: { bookingId },
      data: {
        paymentStatus: BookingPaymentStatus.Failed,
        paymentId: payment.id,
        updatedAt: new Date()
      }
    });
  }
}

// helpers (same as your implementation; keep as-is)
type GuestInfo = {
  fullName?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};

async function markBookingAsPaid(bookingId: string, paymentId?: string): Promise<Booking> {
  const existingBooking = await db.booking.findUnique({ where: { bookingId } });
  if (!existingBooking) {
    throw new Error('Booking not found for payment confirmation');
  }

  if (existingBooking.paymentStatus === BookingPaymentStatus.Success) {
    if (paymentId && !existingBooking.paymentId) {
      await db.booking.update({
        where: { bookingId },
        data: { paymentId }
      });
      existingBooking.paymentId = paymentId;
    }
    return existingBooking;
  }

  const updateData: Prisma.BookingUpdateInput = {
    paymentStatus: BookingPaymentStatus.Success,
    updatedAt: new Date()
  };

  if (paymentId) {
    updateData.paymentId = paymentId;
  }

  const updatedBooking = await db.booking.update({
    where: { bookingId },
    data: updateData
  });

  await sendConfirmationEmail(updatedBooking);

  return updatedBooking;
}

async function sendConfirmationEmail(booking: Booking) {
  const guestInfo = booking.guestInfo as GuestInfo | null;
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
    await sendBookingConfirmationEmail(recipient, bookingDetails);
    console.log(`[Razorpay Service] Confirmation email sent successfully for booking ${booking.bookingId}`);
  } catch (error) {
    console.error(`[Razorpay Service] Booking confirmation email failed for booking ${booking.bookingId}:`, error);
  }
}
