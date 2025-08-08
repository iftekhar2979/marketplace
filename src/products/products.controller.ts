// import { Query, Query } from '@nestjs/common';
import { Body, Controller, Get, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';
import { CreateProductDto } from './dto/CreateProductDto.dto';
import { GetFilesDestination, GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'aws-sdk/clients/budgets';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/multer/multer.config';
import { GetProductsQueryDto } from './dto/GetProductDto.dto';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
export class ProductsController {
constructor(private readonly productsService: ProductsService) {}

@Post()
@UseGuards(JwtAuthenticationGuard)
  @UseInterceptors( FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 6 }, // You can limit the number of files here
      ],
      multerConfig,
    ),)
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  @ApiBody({ type: CreateProductDto })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user ,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @GetFilesDestination() filesDestination: string[],
  ) {
    createProductDto.images = filesDestination;
    return this.productsService.create(createProductDto, user.id);
  }

@Post()
@UseGuards(JwtAuthenticationGuard)
  @ApiResponse({ status: 201, description: 'Product retrived successfully', type: Product })
  @ApiBody({ type: CreateProductDto })
  async getProducts(

  ) {
    return this.productsService.findAll()
  }
@Get()
@UseGuards(JwtAuthenticationGuard)
  @ApiResponse({ status: 201, description: 'Product retrived successfully', type: Product })
  @ApiQuery({ type: GetProductsQueryDto, required: false })
  async getProductsWithFiltering(
@Query() query: GetProductsQueryDto,
  @GetUser() user: User,
  ) {
    return this.productsService.findAllWithFilters(query);
  }

}
