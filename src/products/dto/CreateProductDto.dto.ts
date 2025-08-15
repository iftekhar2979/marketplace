import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 13' })
  @IsString()
  product_name: string;

  @ApiProperty({ description: 'Selling price', example: '499.99' })
  @IsString()
  selling_price: string;

  @ApiProperty({ description: 'Purchasing price', example: '300.00' })
  @IsString()
  phurcasing_price: string; // spelling as per your original

  @ApiProperty({ description: 'Quantity', example: '5' })
  @IsString()
  quantity: string;

  @ApiProperty({ description: 'Description', example: 'A gently used iPhone in excellent condition' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Product images',
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
  })
  @IsOptional()
  images?: any; 

  @ApiProperty({ description: 'Condition', example: 'Used - Like New' })
  @IsString()
  condition: string;


  @ApiProperty({ description: 'Brand', example: 'Apple' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'Is negotiable (true or false)', example: 'true' })
  @IsString()
  is_negotiable: string;

  @ApiProperty({ description: 'Size', example: 'Medium' })
  @IsString()
  size: string;

  @ApiProperty({ description: 'Category', example: 'Electronics' })
  @IsString()
  category: string;
}
