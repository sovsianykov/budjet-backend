import { createZodDto } from 'nestjs-zod';
import { CreateTransactionSchema } from '../validations/transaction.schemas';

export class CreateTransactionDto extends createZodDto(
  CreateTransactionSchema,
) {}
