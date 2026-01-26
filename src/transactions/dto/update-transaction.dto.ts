import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTransactionItemDto } from './create-transaction-item.dto';

export class UpdateTransactionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items?: CreateTransactionItemDto[];
}
