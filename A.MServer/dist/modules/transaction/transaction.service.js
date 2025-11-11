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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
const client_1 = require("@prisma/client");
const db_1 = require("../../shared/lib/db");
const prisma = new client_1.PrismaClient();
function createTransaction(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, items, totalAmount } = request;
        // ... rest of your service code (it is correct)
        const result = yield db_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            const user = yield tx.user.findUnique({
                where: { id: userId },
                select: { id: true, balance: true }
            });
            if (!user) {
                throw new Error('User not found.');
            }
            if (user.balance < totalAmount) {
                throw new Error('Insufficient balance.');
            }
            // 1. Deduct balance from user
            const updatedUser = yield tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: totalAmount } },
            });
            // 2. Create the main transaction record
            const transaction = yield tx.transaction.create({
                data: {
                    userId: user.id,
                    type: 'Purchase',
                    amount: totalAmount,
                    balanceBefore: user.balance,
                    balanceAfter: updatedUser.balance,
                    description: `Purchase of ${items.length} item(s).`,
                    reference: `PUR-${Date.now()}`,
                    items: items,
                },
            });
            const createdPurchases = [];
            // 3. Process each item in the purchase
            for (const item of items) {
                const product = yield tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product || !product.isActive) {
                    throw new Error(`Product "${item.productId}" is not available.`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Not enough stock for "${product.name}". Only ${product.stock} left.`);
                }
                // Create a purchase record for the item
                const purchase = yield tx.purchase.create({
                    data: {
                        userId: user.id,
                        productId: item.productId,
                        transactionId: transaction.id,
                        quantity: item.quantity,
                        unitPrice: product.price,
                        totalAmount: product.price * item.quantity,
                    },
                });
                createdPurchases.push(purchase);
                // Decrement product stock
                yield tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            return {
                transactionId: transaction.id,
                newBalance: updatedUser.balance,
                purchases: createdPurchases,
            };
        }));
        return result;
    });
}
//# sourceMappingURL=transaction.service.js.map