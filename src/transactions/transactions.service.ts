import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransactionItemDto } from './dto/create-transaction-item.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a transaction with validation
  async create(dto: CreateTransactionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Проверка существования всех продуктов
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const existingProductIds = products.map((p) => p.id);
    const missingProducts = productIds.filter(
      (id) => !existingProductIds.includes(id),
    );
    if (missingProducts.length > 0) {
      throw new NotFoundException(
        `Products not found with IDs: ${missingProducts.join(', ')}`,
      );
    }

    try {
      return await this.prisma.transaction.create({
        data: {
          userId: dto.userId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new BadRequestException('Failed to create transaction');
    }
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, user: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async remove(id: string) {
    try {
      return await this.prisma.transaction.delete({ where: { id } });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }

  async updateTransaction(transactionId: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (dto.items) {
      const productIds = dto.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const existingProductIds = products.map((p) => p.id);
      const missingProducts = productIds.filter(
        (id) => !existingProductIds.includes(id),
      );
      if (missingProducts.length > 0) {
        throw new NotFoundException(
          `Products not found with IDs: ${missingProducts.join(', ')}`,
        );
      }

      await this.prisma.transactionItem.deleteMany({
        where: { transactionId },
      });
      await this.prisma.transactionItem.createMany({
        data: dto.items.map((item: CreateTransactionItemDto) => ({
          transactionId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    return this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: { include: { product: true } }, user: true },
    });
  }
}
