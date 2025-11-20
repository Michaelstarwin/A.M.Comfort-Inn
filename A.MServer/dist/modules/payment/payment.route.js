"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// payment.route.ts (update webhook route)
const express_1 = __importDefault(require("express"));
const razorpay_service_1 = require("./razorpay.service");
const validate_middleware_1 = require("../../shared/lib/utils/validate.middleware");
const payment_validation_1 = require("./payment.validation");
const router = express_1.default.Router();
const razorpayService = new razorpay_service_1.RazorpayService();
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
router.post('/verify', (0, validate_middleware_1.validate)(payment_validation_1.verifyPaymentSchema), async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const result = await razorpayService.verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
        res.json(result);
    }
    catch (error) {
        console.error('Verify route error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// IMPORTANT: use raw body and pass original string to the service
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = (req.headers['x-razorpay-signature'] || '');
        if (!signature) {
            console.warn('Missing webhook signature header');
            return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
        }
        const rawBodyString = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
        await razorpayService.handleWebhook(rawBodyString, signature);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=payment.route.js.map