import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().min(1),
  currency: z.string().default('INR'),
  // key: string, value: string
  notes: z.record(z.string(), z.string()).optional()
});

export const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1)
});