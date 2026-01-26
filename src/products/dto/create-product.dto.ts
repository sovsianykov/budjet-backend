import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(2)
  price: number;
}
