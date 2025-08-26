import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumberString, 
  IsBoolean, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  Min, 
  Max, 
  IsBooleanString
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 13' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  product_name: string;

  @ApiProperty({ description: 'Selling price', example: '499.99' })
  @IsNumberString()
  selling_price: string;

  @ApiProperty({ description: 'Purchasing price', example: '300.00' })
  @IsNumberString()
  phurcasing_price: string; 

  @ApiProperty({ description: 'Quantity', example: '5' })
  @IsNumberString()
  quantity: string;

  @ApiProperty({ description: 'Description', example: 'A gently used iPhone in excellent condition' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
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
  @MinLength(2)
  @MaxLength(50)
  condition: string;

  @ApiProperty({ description: 'Brand', example: 'Apple' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  brand: string;

  @ApiProperty({ description: 'Is negotiable (true or false)', example: 'true' })
  @IsBooleanString()
  is_negotiable: string;
  @ApiProperty({ description: 'Is Boosted (true or false)', example: 'true' })
  @IsBooleanString()
  is_boosted: string;

  @ApiProperty({ description: 'Size', example: 'Medium' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  size: string;

  @ApiProperty({ description: 'Category', example: 'Electronics' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  category: string;

}
