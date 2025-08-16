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

  @ApiProperty({ description: 'Height of the product (in cm)', example: '11', required: true })
  @IsNumberString()
  @MinLength(1)
  @MaxLength(3)
  height: string;

  @ApiProperty({ description: 'Width of the product (in cm)', example: '10', required: true })
  @IsNumberString()
  @MinLength(1)
  @MaxLength(3)
  width: string;

  @ApiProperty({ description: 'Length of the product (in feet)', example: '1', required: true })
  @IsNumberString()
@MinLength(1)
  @MaxLength(3)
  length: string;

  @ApiProperty({ description: 'Weight of the product (in kg)', example: '1', required: true })
  @IsNumberString()
 @MinLength(1)
  @MaxLength(3)
  weight: string;


  @ApiProperty({ example: 'House-1,Dhaka', description: 'Address Line 1' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    address_line_1: string;
    @ApiProperty({ example: 'House-1,Road-5', description: 'Address Line 2' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    address_line_2: string;
  @ApiProperty({ example: 'House-1,Road-5', description: 'Address Line 2' })
      @IsBooleanString()
  is_address_residential: string;

      @ApiProperty({ example: 'Bangladesh', description: 'Country Name' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    country: string;
  @ApiProperty({ description: 'City of Location', example: 'Dhaka' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;
  @ApiProperty({ description: 'Postal code', example: '1212' })
  @IsNumberString()
  @MinLength(2)
  @MaxLength(10)
  postal_code: string;
  @ApiProperty({ description: 'Country ID', example: '112' })
  @IsNumberString()
  @MinLength(1)
  @MaxLength(4)
  country_id: string;

  @ApiProperty({ description: 'Country Code', example: 'US' })
  @IsString()
  @MinLength(1)
  @MaxLength(4)
  country_code: string;
}
