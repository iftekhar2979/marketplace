import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, ILike, In, Repository } from 'typeorm';
import { FavouriteProduct, Product } from './entities/products.entity';
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
import { use } from 'passport';
// import { Product } from './entities/product.entity';
// import { CreateProductDto } from './dto/create-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';
// import { ProductImage } from '../product-image/entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

     private readonly dataSource: DataSource, 
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
  async create(createProductDto: CreateProductDto, user: User) {
     const sellingPrice = parseFloat(createProductDto.selling_price);
  const purchasingPrice = parseFloat(createProductDto.phurcasing_price); // keep original spelling if necessary
  const quantity = parseInt(createProductDto.quantity, 10);
  const height = parseFloat(createProductDto.height);
  const width = parseFloat(createProductDto.width);
  const length = parseFloat(createProductDto.length);
  const weight = parseFloat(createProductDto.weight);
  // const postalCode = parseFloat(createProductDto.postal_code)
  const isNegotiable = createProductDto.is_negotiable.toLowerCase() === 'true';
  const id_address_residential = createProductDto.is_address_residential.toLocaleLowerCase() === 'true';

  // Validate that numeric values are valid
  if (isNaN(sellingPrice) || isNaN(purchasingPrice) || isNaN(quantity) || isNaN(height) || isNaN(width) || isNaN(length) || isNaN(weight)) {
    throw new BadRequestException('Invalid numeric values for price, quantity, or dimensions');
  }

    // Start a transaction to ensure product and images are saved together
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Create product instance
      const product = new Product();
      product.user_id = user.id;  // Set userId
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
      product.status = ProductStatus.PENDING; // Default status
      product.height = height;
      product.width = width;
      product.length = length;
      product.weight = weight;
      product.city = createProductDto.city;
      product.postal_code = createProductDto.postal_code;
      product.country_id = parseInt(createProductDto.country_id, 10);
      product.country_code = createProductDto.country_code;
      product.is_address_residential = id_address_residential;
      product.address_line_1 = createProductDto.address_line_1;
      product.address_line_2 = createProductDto.address_line_2;
      product.country = createProductDto.country;

      // Save product inside the transaction
      const savedProduct = await queryRunner.manager.save(Product, product);

      // Handle images if any
      if (createProductDto.images && Array.isArray(createProductDto.images)) {
        const productImages = createProductDto.images.map((imgUrl: string) => {
          const img = new ProductImage();
          img.image = imgUrl;
          img.product_id = savedProduct.id;  // Associate image with the product
          return img;
        });
console.log(productImages)
        // Save product images inside the transaction
        await queryRunner.manager.save(ProductImage, productImages);
      }

      // Commit the transaction after saving both product and images
      await queryRunner.commitTransaction();
 // Create notification (can also be part of the transaction)
      await this.notificationService.createNotification({
        userId: user.id,
        related: NotificationRelated.PRODUCT,
        msg: `${user.firstName} has listed a product for your review!`,
        type: NotificationType.SUCCESS,
        targetId: savedProduct.id,
        notificationFor: UserRoles.ADMIN,
        action: NotificationAction.CREATED,
        isImportant: true,
      });
      const productWithImages = await this.productRepository.findOne({
        where: { id: savedProduct.id },
        // relations: ['images']
      });
      const productImage = await this.productImageRepository.find({
        where: { product_id: savedProduct.id },
      });
      productWithImages.images = productImage; // Attach images to the product
      return {
        message: 'Product created successfully',
        data: productWithImages,
        statusCode: 201,
      };
    } catch (error) {
      // Rollback the transaction in case of any error
      await queryRunner.rollbackTransaction();
      console.error('Error in creating product and images:', error);
      throw new BadRequestException('Error occurred while creating the product');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
  async findAll(
  page = 1,
  limit = 10,
  filters?: { name?: string; category?: string; size?: string ,userId ?:string , type:'own' | 'global' },
): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;

  const query = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.images', 'images');

    if(filters.type =='own'){
query.andWhere('product.user_id = :user_id',{user_id:filters.userId})
    }
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
    userId,
    type
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

  if (type === 'own') {
    where.user_id = userId;
  }

  where.status = ProductStatus.AVAILABLE;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

console.log(userId)
  const [data, total] = await this.productRepository.findAndCount({
    where,
    skip,
    take,
    order: { created_at: 'DESC' },
    // relations: ['images'],  // Ensure images are loaded
  });
const productIds = data.map(product => product.id);
  const productImages = await this.productImageRepository.find({
    where: { product_id: In(productIds) },
  }); 
  data.forEach(product => {
    product.images = productImages.filter(image => image.product_id === product.id);
  });
  return {
    message: "Products retrieved successfully",
    statusCode: 200,
    data,
    pagination: pagination({ page: parseInt(page), limit: parseInt(limit), total }),
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
      relations: [ 'user','favorites','images'], 
    });
  }

    async updateProductsStatus(id: number, status:ProductStatus ): Promise<ResponseInterface<Product>> {
      
    const product = await this.productRepository.findOne({ where: { id ,status:ProductStatus.PENDING } });
    if(!product){
      throw new NotFoundException("Product not found!")
    }
    await this.productRepository.save(product)
    return {message:"Product updated",statusCode:200,data: product,status:"success"}
    }
   async getProductifFavourites(id: number, userId ?: string): Promise<any> {
  
const product = await this.getProduct(id)
    // If the product doesn't exist, throw an exception
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if(product.status === ProductStatus.REJECTED){
      throw new BadRequestException('Product is Rejected');
    }
    if(product.status === ProductStatus.PENDING){
      throw new BadRequestException('Product is pending');
    }
    if(product.status === ProductStatus.DELETED){
      throw new BadRequestException('Product is deleted');
    }
    if(product.status === ProductStatus.SOLD){
      throw new BadRequestException('Product is sold');
    }
    // Check if the product has been favorited by the user
    const isFavorite = product.favorites.some(
      (favorite) => favorite.user.id === userId
    );
delete product.favorites

    // Return product with favorite status (true or false) and associated images
    return {
      message: 'Product retrieved successfully',
      statusCode: 200,
      data: {
        ...product,  // Spread product properties
        isFavorite,  // Set the favorite status based on user’s favorite
      },
    };
  
}
async checkProductIsAvailable(product:Product){
  if(product.status === ProductStatus.REJECTED){
      throw new BadRequestException('Product is Rejected');
    }
    if(product.status === ProductStatus.PENDING){
      throw new BadRequestException('Product is pending');
    }
    if(product.status === ProductStatus.DELETED){
      throw new BadRequestException('Product is deleted');
    }
    if(product.status === ProductStatus.SOLD){
      throw new BadRequestException('Product is sold');
    }
    return product
}
  async getProductIdAndDelete(product_id: number, userId?: string) {
    const product = await this.productRepository.findOne({ where: { id: product_id, user_id: userId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Option 1: Soft delete (recommended if you have a status field)
    product.status = ProductStatus.DELETED;
    await this.productRepository.save(product);

    // Option 2: Hard delete (uncomment if you want to remove from DB)
    // await this.productRepository.delete({ id: product_id, user_id: userId });

    return {
      message: 'Product deleted successfully',
      statusCode: 200,
      data: {},
    };
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
