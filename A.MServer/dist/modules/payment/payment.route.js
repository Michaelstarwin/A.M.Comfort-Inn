"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const razorpay_service_1 = require("./razorpay.service");
const validate_middleware_1 = require("../../shared/lib/utils/validate.middleware");
const payment_validation_1 = require("./payment.validation");
const router = express_1.default.Router();
const razorpayService = new razorpay_service_1.RazorpayService();
// Create payment order
router.post('/create-order', (0, validate_middleware_1.validate)(payment_validation_1.createOrderSchema), async (req, res) => {
    try {
        const result = await razorpayService.createOrder(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Verify payment
router.post('/verify', (0, validate_middleware_1.validate)(payment_validation_1.verifyPaymentSchema), async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const result = await razorpayService.verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
// Handle Razorpay webhooks
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            throw new Error('Missing webhook signature');
        }
        await razorpayService.handleWebhook(req.body, signature);
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