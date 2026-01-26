import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
