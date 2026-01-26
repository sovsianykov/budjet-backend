import { z } from 'zod';

export const CreateTransactionItemSchema = z.object({
  productId: z.uuid({
    message: 'Product ID must be a valid UUID.',
  }),
  quantity: z.number().int().positive(),
});

export const CreateTransactionSchema = z.object({
  userId: z.uuid({
    message: 'User ID must be a valid UUID.',
  }),
  items: z
    .array(CreateTransactionItemSchema)
    .nonempty({ message: 'Items cannot be empty.' }),
});

export const UpdateTransactionSchema = z.object({
  items: z.array(CreateTransactionItemSchema).min(1).optional(),
});
