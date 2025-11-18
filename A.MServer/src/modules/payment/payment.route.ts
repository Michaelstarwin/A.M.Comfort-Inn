// payment.route.ts (update webhook route)
import express from 'express';
import { RazorpayService } from './razorpay.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import { createOrderSchema, verifyPaymentSchema } from './payment.validation';

const router = express.Router();
const razorpayService = new RazorpayService();

router.post('/create-order', validate(createOrderSchema), async (req, res) => {
  try {
    const result = await razorpayService.createOrder(req.body);
    if (result.success) return res.json(result);
    return res.status(400).json(result);
  } catch (error: any) {
    console.error('Create-order route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    console.error('Verify route error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// IMPORTANT: use raw body and pass original string to the service
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    if (!signature) {
      console.warn('Missing webhook signature header');
      return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
    }

    const rawBodyString = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);

    await razorpayService.handleWebhook(rawBodyString, signature);
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
