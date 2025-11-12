import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Booking, BookingPaymentStatus, Prisma } from '@prisma/client';
import { db } from '../../shared/lib/db';
import { sendBookingConfirmationEmail } from '../../shared/lib/utils/sendEmail';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export interface CreateOrderRequest {
  bookingId: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  async createOrder(request: CreateOrderRequest) {
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
      await db.booking.update({
        where: { bookingId: bookingId },
        data: {
          paymentOrderId: order.id,
          paymentStatus: BookingPaymentStatus.Pending,
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
    } catch (error: any) {
      console.error('Razorpay order creation failed:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
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
      const bookingId = order.notes?.bookingId as string | undefined;
      if (!bookingId) {
        throw new Error('Booking ID not found in order notes');
      }

      // Update booking status and notify customer
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
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      throw new Error(error.message || 'Payment verification failed');
    }
  }

  async handleWebhook(payload: any, signature: string) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
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
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      throw new Error(error.message || 'Webhook processing failed');
    }
  }

  private async handlePaymentCaptured(payment: any) {
    const order = await razorpay.orders.fetch(payment.order_id);
    const bookingId = order.notes?.bookingId as string | undefined;
    if (!bookingId) {
      throw new Error('Booking ID not found in order notes');
    }

    await markBookingAsPaid(bookingId, payment.id);
  }

  private async handlePaymentFailed(payment: any) {
    const order = await razorpay.orders.fetch(payment.order_id);
    const bookingId = order.notes?.bookingId as string | undefined;
    if (!bookingId) {
      throw new Error('Booking ID not found in order notes');
    }

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
    await sendBookingConfirmationEmail(recipient, bookingDetails);
  } catch (error) {
    console.error('Booking confirmation email failed:', error);
  }
}