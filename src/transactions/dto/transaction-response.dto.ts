import { CreateTransactionItemDto } from './create-transaction-item.dto';

export class TransactionResponseDto {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  items: CreateTransactionItemDto[];
}
