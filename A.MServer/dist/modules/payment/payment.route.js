"use strict";
// A.MServer/src/modules/payment/payment.route.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const razorpay_service_1 = require("./razorpay.service");
const validate_middleware_1 = require("../../shared/lib/utils/validate.middleware");
const payment_validation_1 = require("./payment.validation"); // Removed verifyPaymentSchema for debugging
const router = express_1.default.Router();
const razorpayService = new razorpay_service_1.RazorpayService();
// Create Order Route
router.post('/create-order', (0, validate_middleware_1.validate)(payment_validation_1.createOrderSchema), async (req, res) => {
    try {
        const result = await razorpayService.createOrder(req.body);
        if (result.success)
            return res.json(result);
        return res.status(400).json(result);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Verification failed:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
});
// Webhook Route
router.post('/webhook', async (req, res) => {
    try {
        const signature = (req.headers['x-razorpay-signature'] || '');
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
    }
    catch (error) {
        console.error('[Webhook] Error:', error);
        // Still return 200 to stop Razorpay retries
        res.json({ success: true, message: 'Webhook received' });
    }
});
exports.default = router;
//# sourceMappingURL=payment.route.js.map