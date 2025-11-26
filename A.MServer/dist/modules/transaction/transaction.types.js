"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
const itemSchema = zod_1.z.object({
    productId: zod_1.z.string().cuid("Invalid product ID format."),
    quantity: zod_1.z.number().int().positive("Item quantity must be a positive integer."),
});
exports.createTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid("A valid user ID is required."),
        items: zod_1.z.array(itemSchema).min(1, "At least one item is required for a transaction."),
        totalAmount: zod_1.z.number().positive("Total amount must be a positive number."),
    }),
});
//# sourceMappingURL=transaction.types.js.map