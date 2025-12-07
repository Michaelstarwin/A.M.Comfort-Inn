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
        console.log("3. Calling razorpayService.verifyPayment...");
        const result = await razorpayService.verifyPayment(paymentId, orderId, signature);
        console.log("--- VERIFICATION SUCCESS ---");
        console.log("Result:", JSON.stringify(result, null, 2));
        res.json(result);
    }
    catch (error) {
        console.error('--- VERIFICATION FAILED ---');
        console.error('Error Message:', error.message);
        if (error.stack)
            console.error('Stack:', error.stack);
        // Log what was actually received to debug if keys were missing
        console.error('Failed Request Body:', JSON.stringify(req.body, null, 2));
        res.status(400).json({
            success: false,
            message: error.message || "Payment Verification Failed",
            debug_info: {
                received: {
                    paymentId: req.body.razorpay_payment_id || req.body.paymentId,
                    orderId: req.body.razorpay_order_id || req.body.orderId,
                    signature: req.body.razorpay_signature ? 'PRESENT' : 'MISSING'
                },
                error: error.message
            }
        });
    }
});
// Webhook Route
router.post('/webhook', async (req, res) => {
    try {
        const signature = (req.headers['x-razorpay-signature'] || '');
        if (!signature) {
            return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
        }
        // Use rawBody captured by app.ts middleware if available, otherwise fall back to body
        // (Note: app.ts middleware guarantees rawBody is present if configured correctly)
        const rawBody = req.rawBody || req.body;
        await razorpayService.handleWebhook(rawBody, signature);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=payment.route.js.map