import { ResponseInterface } from 'src/common/types/responseInterface';
// import { Query, Query } from '@nestjs/common';
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';
import { CreateProductDto } from './dto/CreateProductDto.dto';
import { GetFilesDestination, GetOptionalFilesDestination, GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/multer/multer.config';
import { GetProductsQueryDto } from './dto/GetProductDto.dto';
import { UpdateProductDto } from './dto/updatingProduct.dto';
import { User } from 'src/user/entities/user.entity';
import { Roles } from 'src/user/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles-auth.guard';
import { ProductStatus } from './enums/status.enum';
import { UserRoles } from 'src/user/enums/role.enum';

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
    // if(createProductDto)
    return this.productsService.create(createProductDto, user);
  }

// @Post()
// @UseGuards(JwtAuthenticationGuard)
//   @ApiResponse({ status: 201, description: 'Product retrived successfully', type: Product })
//   @ApiBody({ type: CreateProductDto })
//   async getProducts(

//   ) {
//     return this.productsService.findAll()
//   }
@Get()
@UseGuards(JwtAuthenticationGuard)
  @ApiResponse({ status: 200, description: 'Product retrived successfully', type: Product })
  @ApiQuery({ type: GetProductsQueryDto, required: false })
  async getProductsWithFiltering(
@Query() query: GetProductsQueryDto,
  @GetUser() user: User,
  ) {
    if(query.userId){
      throw new ForbiddenException("Can't resolve the api")
    }
    query.userId = user.id
    query.user = user
    // console.log(query)
    return this.productsService.findAllWithFilters(query);
  }
 @Put(':id')
 @UseGuards(JwtAuthenticationGuard)
   @UseInterceptors( FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 6 }, // You can limit the number of files here
      ],
      multerConfig,
    ),)
 @UsePipes(new ValidationPipe({ transform: true }))
@ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
@ApiParam({ name: 'id', type: Number, description: 'ID of the product to update' })
 @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
        @UploadedFiles() files: { images?: Express.Multer.File[] },
        @GetUser() user,
    @GetOptionalFilesDestination() filesDestination: string[],
  ) {
    updateProductDto.images = filesDestination;
    return this.productsService.updateProduct(id, updateProductDto,user.id);
  }
 @Put(':id/boosts')
 @UseGuards(JwtAuthenticationGuard)
 @UsePipes(new ValidationPipe({ transform: true }))
@ApiResponse({ status: 200, description: 'Product boosted successfully', type: Product })
@ApiParam({ name: 'id', type: Number, description: 'ID of the product to update' })
  async boostProduct(
    @Param('id', ParseIntPipe) id: number,
        @GetUser() user:User,
  ) {
    return this.productsService.boostProduct({productId:id,user});
  }


  @Patch('/status/:id')
   @UseGuards(JwtAuthenticationGuard,RolesGuard)
   @Roles(UserRoles.ADMIN)
@ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
@ApiParam({ name: 'id', type: Number, description: 'ID of the read the product' })
  async updateProductStatus(@Param('id', ParseIntPipe) id: number,@GetUser() user:User): Promise<ResponseInterface<Product>> {
    return this.productsService.updateProductsStatus(id,ProductStatus.AVAILABLE);
  }
  @Get(':id')
   @UseGuards(JwtAuthenticationGuard)
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
@ApiParam({ name: 'id', type: Number, description: 'ID of the read the product' })
  async getProductById(@Param('id', ParseIntPipe) id: number,@GetUser() user:User): Promise<ResponseInterface<Product>> {
    return this.productsService.getProductifFavourites(id,user.id);
  }
  @Delete(':id')
   @UseGuards(JwtAuthenticationGuard)
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
@ApiParam({ name: 'id', type: Number, description: 'ID of the read the product' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number,@GetUser() user:User) {
    return this.productsService.getProductIdAndDelete(id,user.id);
  }
}
