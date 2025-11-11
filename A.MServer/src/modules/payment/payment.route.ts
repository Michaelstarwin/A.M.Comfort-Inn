import express from 'express';
import { RazorpayService } from './razorpay.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import { createOrderSchema, verifyPaymentSchema } from './payment.validation';

const router = express.Router();
const razorpayService = new RazorpayService();

// Create payment order
router.post('/create-order', validate(createOrderSchema), async (req, res) => {
  try {
    const result = await razorpayService.createOrder(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Verify payment
router.post('/verify', validate(verifyPaymentSchema), async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const result = await razorpayService.verifyPayment(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Handle Razorpay webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    await razorpayService.handleWebhook(req.body, signature as string);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;