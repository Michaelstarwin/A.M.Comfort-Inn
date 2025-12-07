// A.MServer/src/modules/payment/payment.route.ts

import express from 'express';
import { RazorpayService } from './razorpay.service';
import { validate } from '../../shared/lib/utils/validate.middleware';
import { createOrderSchema } from './payment.validation'; // Removed verifyPaymentSchema for debugging

const router = express.Router();
const razorpayService = new RazorpayService();

// Create Order Route
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

// Verify Route - THE CRITICAL FIX
router.post('/verify', async (req, res) => {
  try {
    console.log("--- PAYMENT VERIFICATION ---");
    console.log("Received body:", JSON.stringify(req.body, null, 2));

    const paymentId = req.body.razorpay_payment_id;
    const orderId = req.body.razorpay_order_id;
    const signature = req.body.razorpay_signature;

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields"
      });
    }

    const result = await razorpayService.verifyPayment(paymentId, orderId, signature);
    res.json(result);

  } catch (error: any) {
    console.error('Verification failed:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed"
    });
  }
});

// Webhook Route
router.post('/webhook', async (req: any, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;

    if (!signature) {
      console.warn('[Webhook] No signature header - accepting in test mode');
    }

    // req.rawBody is set by the global express.json({ verify: ... }) in app.ts
    // OR by the express.raw logic here if it takes precedence.
    // However, since app.ts mounts routes AFTER global middleware, global middleware runs first.
    // If the Content-Type is application/json, global middleware parses it and sets req.rawBody.
    // We should prefer req.rawBody.
    const rawBody = req.rawBody || req.body;

    // ✅ Always return 200 to Razorpay (so they don't retry endlessly)
    // Process webhook asynchronously
    razorpayService.handleWebhook(rawBody, signature)
      .then(() => console.log('[Webhook] Processed successfully'))
      .catch(err => console.error('[Webhook] Processing error:', err.message));

    // Return immediately
    res.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    // Still return 200 to stop Razorpay retries
    res.json({ success: true, message: 'Webhook received' });
  }
});

export default router;