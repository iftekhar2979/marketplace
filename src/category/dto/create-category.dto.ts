// src/category/dto/create-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}


