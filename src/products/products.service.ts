import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { ProductImage } from './entities/productImage.entity';
import { CreateProductDto } from './dto/CreateProductDto.dto';
import { ProductStatus } from './enums/status.enum';
import { GetProductsQueryDto } from './dto/GetProductDto.dto';
import { pagination } from 'src/shared/utils/pagination';
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
  ) {}

  async create(createProductDto: CreateProductDto, userId: number) {
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
    product.user_id = userId.toString(); // convert userId to string
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
    product.status = ProductStatus.AVAILABLE; // or whatever default

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
      pagination: pagination({page,limit, total})
    };
  }

}
