import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Create a new transaction
  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  // Get all transactions
  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }

  // Get a single transaction by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  // Delete a transaction by ID
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.updateTransaction(id, dto);
  }
}
