import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // путь к твоему PrismaService
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { productName: createProductDto.productName },
    });

    if (existing) {
      throw new Error('Product with this name already exists');
    }

    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll() {
    return await this.prisma.product.findMany();
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const hasTransactions = await this.prisma.transactionItem.count({
      where: { productId: id },
    });

    if (hasTransactions > 0) {
      throw new ConflictException(
        'Cannot delete product because it is used in transactions',
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
