"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
router.post('/create-order', (0, validate_middleware_1.validate)(payment_validation_1.createOrderSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield razorpayService.createOrder(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));
// Verify payment
router.post('/verify', (0, validate_middleware_1.validate)(payment_validation_1.verifyPaymentSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const result = yield razorpayService.verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));
// Handle Razorpay webhooks
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            throw new Error('Missing webhook signature');
        }
        yield razorpayService.handleWebhook(req.body, signature);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));
exports.default = router;
