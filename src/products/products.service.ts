import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { ProductImage } from './entities/productImage.entity';
import { CreateProductDto } from './dto/CreateProductDto.dto';
import { ProductStatus } from './enums/status.enum';
import { GetProductsQueryDto } from './dto/GetProductDto.dto';
import { pagination } from 'src/shared/utils/pagination';
import { UpdateProductDto } from './dto/updatingProduct.dto';
import { ResponseInterface } from 'src/common/types/responseInterface';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationAction, NotificationRelated, NotificationType } from 'src/notifications/entities/notifications.entity';
import { UserRoles } from 'src/user/enums/role.enum';
import { User } from 'src/user/entities/user.entity';
// import { Product } from './entities/product.entity';
// import { CreateProductDto } from './dto/create-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';
// import { ProductImage } from '../product-image/entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly notificationService: NotificationsService
  ) {}
// async getProductById({product_id,status,}){

// }
 checkProductStatus(status:ProductStatus){
if(status === ProductStatus.SOLD) {
      throw new BadRequestException('Product is already sold');
    }
    if(status === ProductStatus.DELETED) {
      throw new BadRequestException('Product is already Deleted');
    }
}

  async updateProductStatus(
    {id,user_id, status}:{id:number;user_id?:string;status:ProductStatus}
  ): Promise<Product> {
    const query =user_id ? {id,user_id} :{ id };
    const product = await this.productRepository.findOne({ where: { ...query} });   
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found.`);
    }
    this.checkProductStatus(product.status)
    
    return this.productRepository.save({
      ...product,
      status,
    });
  }
  async create(createProductDto: CreateProductDto, user:User) {
    // Parse and validate numeric and boolean fields
    const sellingPrice = parseFloat(createProductDto.selling_price);
    const purchasingPrice = parseFloat(createProductDto.phurcasing_price); // keep original spelling if necessary
    const quantity = parseInt(createProductDto.quantity, 10);
    const isNegotiable = createProductDto.is_negotiable.toLowerCase() === 'true';

    if (isNaN(sellingPrice) || isNaN(purchasingPrice) || isNaN(quantity)) {
      throw new BadRequestException('Invalid numeric values for price or quantity');
    }

    // Prepare Product entity
    const product = new Product();
    product.user_id = user.id  // convert userId to string
    product.product_name = createProductDto.product_name;
    product.selling_price = sellingPrice;
    product.purchasing_price = purchasingPrice;
    product.category = createProductDto.category;
    product.quantity = quantity;
    product.description = createProductDto.description;
    product.condition = createProductDto.condition;
    product.size = createProductDto.size;
    product.brand = createProductDto.brand;
    product.is_negotiable = isNegotiable;
    product.status = ProductStatus.PENDING; // or whatever default

   const productInfo =await this.productRepository.save(product);
    // Handle images if any
    if (createProductDto.images && Array.isArray(createProductDto.images)) {
      product.images = createProductDto.images.map((imgUrl: string) => {
        const img = new ProductImage();
        img.image = imgUrl; // assuming images are URLs; if files, handle accordingly
        img.product_id = product.id; // link image to product
        return img;
    });
    console.log(product.images)
  await this.productImageRepository.insert(product.images); 
    }
    await this.notificationService.createNotification(
      {userId:user.id,
        related:NotificationRelated.PRODUCT,
        msg:`${user.firstName} has listed a product for your review!`,
        type:NotificationType.SUCCESS, 
        targetId:product.id,
        notificationFor:UserRoles.ADMIN ,
        action:NotificationAction.CREATED,
        isImportant: true})

    return {message:"Product created successfully", data: await this.productRepository.save(product) ,statusCode:201};
  }
  async findAll(
  page = 1,
  limit = 10,
  filters?: { name?: string; category?: string; size?: string },
): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;

  const query = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.images', 'images');

  // Filters
  if (filters?.name) {
    query.andWhere('product.product_name ILIKE :name', { name: `%${filters.name}%` });
  }

  if (filters?.category) {
    query.andWhere('product.category ILIKE :category', { category: `%${filters.category}%` });
  }

  if (filters?.size) {
    query.andWhere('product.size = :size', { size: filters.size });
  }

  // Pagination
  query.skip(skip).take(limit);

  const [data, total] = await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
  };
}

   async findAllWithFilters(query: GetProductsQueryDto) {
    const {
      term,
      size,
      category,
      price,
      page = '1',
      limit = '10',
    } = query;

    const where: any = {};

    // Text Search
    if (term) {
      where.product_name = ILike(`%${term}%`);
    }

    if (category) {
      where.category = ILike(`%${category}%`);
    }

    if (size) {
      const sizes = size.split(',');
      where.size = In(sizes);
    }

    if (price) {
      const [min, max] = price.split('-').map(Number);
      where.selling_price = Between(min || 0, max || Number.MAX_SAFE_INTEGER);
    }
where.status = ProductStatus.AVAILABLE;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [data, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take,
      order: { created_at: 'DESC' },
    });

    return {
      message: "Products retrieved successfully",
      statusCode: 200,
      data,
      pagination: pagination({page : parseInt(page),limit : parseInt(page), total})
    };
  }

   async updateProduct(id: number, updateDto: UpdateProductDto , user_id:string): Promise<{message:string,statusCode:number,data:Product}> {
    const product = await this.productRepository.findOne({ where: { id,user_id ,status:ProductStatus.AVAILABLE } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found.`);
    }

    try {
      console.log(updateDto.images.length > 0)
    
           Object.assign(product, {
        ...updateDto,
        selling_price: Number(updateDto.selling_price),
        purchasing_price: Number(updateDto.phurcasing_price),
        quantity: Number(updateDto.quantity),
        is_negotiable: updateDto.is_negotiable === 'true',
        images: updateDto.images.length > 0 ? updateDto.images : product.images
      });
      // Optional: Replace images if new images are provided
      if(updateDto.images && Array.isArray(updateDto.images) && updateDto.images.length > 0) {
 await this.productImageRepository.delete({ product_id: id });

        // Add new images
       product.images = updateDto.images.map((imgUrl: string) => {
        const img = new ProductImage();
        img.image = imgUrl; // assuming images are URLs; if files, handle accordingly
        img.product_id = product.id; // link image to product
        return img;
      });
        await this.productImageRepository.insert(product.images);
      }
await this.productRepository.save(product);
      return {message:"Product updated successfully", statusCode:200, data: product};
    } catch (error) {
      console.error('Error updating product:', error);
      throw new BadRequestException('Failed to update product.');
    }
  }

  async getProduct(id:number):Promise<Product>{
    return await this.productRepository.findOne({
      where: { id },
      relations: [ 'user'], 
    });
  }
   async getProductById(id: number): Promise<ResponseInterface<Product>> {
    const product = await this.getProduct(id)
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return {message:"Product Retrived Successfully",data:product,statusCode:200,status:"success"};
  }

  async findByIdWithSeller(productId: number): Promise<Product> {
    return await this.productRepository.findOne({
      where: { id: productId },
      relations: ['user'],
    });
}
}
