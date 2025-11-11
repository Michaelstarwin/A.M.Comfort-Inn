"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
    amount: zod_1.z.number().min(1),
    currency: zod_1.z.string().default('INR'),
    // key: string, value: string
    notes: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional()
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpay_payment_id: zod_1.z.string().min(1),
    razorpay_order_id: zod_1.z.string().min(1),
    razorpay_signature: zod_1.z.string().min(1)
});
