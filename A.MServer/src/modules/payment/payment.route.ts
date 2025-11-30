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
    console.log("--- START PAYMENT VERIFICATION ---");
    console.log("1. Raw Body received from Frontend:", req.body);

    // 1. SAFEGUARD: Handle different naming conventions
    // Frontend might send 'razorpay_payment_id' OR 'paymentId'
    const paymentId = req.body.razorpay_payment_id || req.body.paymentId;
    const orderId = req.body.razorpay_order_id || req.body.orderId;
    const signature = req.body.razorpay_signature || req.body.signature;

    console.log("2. Extracted Variables:", { paymentId, orderId, signature });

    // 2. CHECK: Are they missing?
    if (!paymentId || !orderId || !signature) {
      console.error("FAILED: Missing required payment fields.");
      return res.status(400).json({
        success: false,
        message: "Missing required fields: paymentId, orderId, or signature"
      });
    }

    // 3. EXECUTE: Call the service
    const result = await razorpayService.verifyPayment(
      paymentId,
      orderId,
      signature
    );

    console.log("--- VERIFICATION SUCCESS ---");
    res.json(result);

  } catch (error: any) {
    console.error('--- VERIFICATION FAILED ---');
    console.error('Error Message:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Payment Verification Failed"
    });
  }
});

// Webhook Route
router.post('/webhook', async (req: any, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
    }

    // Use rawBody captured by app.ts middleware if available, otherwise fall back to body
    // (Note: app.ts middleware guarantees rawBody is present if configured correctly)
    const rawBody = req.rawBody || req.body;

    await razorpayService.handleWebhook(rawBody, signature);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;