import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().cuid("Invalid product ID format."),
  quantity: z.number().int().positive("Item quantity must be a positive integer."),
});

export const createTransactionSchema = z.object({
  body: z.object({
    userId: z.string().cuid("A valid user ID is required."),
    items: z.array(itemSchema).min(1, "At least one item is required for a transaction."),
    totalAmount: z.number().positive("Total amount must be a positive number."),
  }),
});

// FIX: This line creates and exports the TypeScript type from the schema.
export type CreateTransactionRequest = z.infer<typeof createTransactionSchema.shape.body>;

