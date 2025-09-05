
import { BadRequestException, ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { Offer } from 'src/offers/entities/offer.entity';
import { OrderStatus, PaymentStatus } from './enums/orderStatus';
import { ResponseInterface } from "src/common/types/responseInterface";
import { pagination } from 'src/shared/utils/pagination';
import { NotificationAction, NotificationRelated, Notifications, NotificationType } from 'src/notifications/entities/notifications.entity';
import { UserRoles } from 'src/user/enums/role.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/products/entities/products.entity';
import { ProductStatus } from 'src/products/enums/status.enum';
import { Wallets } from 'src/wallets/entity/wallets.entity';
import { Transections } from 'src/transections/entity/transections.entity';
import { TransectionType } from 'src/transections/enums/transectionTypes';
@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        private readonly notificaionService:NotificationsService ,
         private readonly dataSource: DataSource, 
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(Wallets) private walletRepository: Repository<Wallets>,
        @InjectRepository(Transections) private transectionRespositoy : Repository<Transections>
        
      ){}
async createOrderFromOffer(offer: Offer): Promise<Order> {
 try{
  if (offer.order_id) {
    throw new BadRequestException('Order already exists for this offer');
  }
 const existingOrder = await this.orderRepository.findOne({
    where: { product:{ id: offer.product.id }},
    relations: ['product', 'accepted_offer', 'delivery', 'buyer', 'seller'],
  });
  if (existingOrder) {
    throw new BadRequestException('Order already exists for this Product');
  }
  const order = this.orderRepository.create({
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING,
    buyer: offer.buyer,
    buyer_id: offer.buyer.id,
    seller: offer.seller,
    seller_id: offer.seller.id,
    product: offer.product,
    accepted_offer: offer,
    offer_id: offer.id,
    delivery: null,
    delivery_id: null,
  });
  console.log("ORDERInfo",order)
const productName = offer.product.product_name
  const notifications =[
    {

    userId: offer.buyer.id,
    user: offer.buyer,
    isImportant: true,
    action: NotificationAction.UPDATED,
    related: NotificationRelated.ORDER,
    notificationFor: UserRoles.USER,
    type: NotificationType.SUCCESS,
    targetId: order.id,
    msg: `${productName} is now ready to phurcase !`
  },
    {

    userId: offer.seller.id,
    user : offer.seller,
    isImportant: true,
    action: NotificationAction.UPDATED,
    related: NotificationRelated.ORDER,
    notificationFor: UserRoles.USER,
    type: NotificationType.INFO,
    targetId: order.id,
    msg: `${productName} is ready to sell!`
  },
    {
    userId: null,
    isImportant: true,
    action: NotificationAction.UPDATED,
    related: NotificationRelated.ORDER,
    notificationFor: UserRoles.ADMIN,
    type: NotificationType.INFO,
    targetId: order.id,
    msg: `#${order.id} both are agreed with negotiation!`
  }
]
await this.notificaionService.bulkInsertNotifications(notifications)
  return await this.orderRepository.save(order)
}catch (error) {
    console.error('Error creating order from offer:', error);
    throw new BadRequestException('Failed to create order from offer');
}}

async findByBuyerId(
  buyerId: string,
   page :number =1,
  limit :number = 10,
): Promise<ResponseInterface<Order[]>> {
  const [orders, total] = await this.orderRepository.findAndCount({
    where: { buyer_id: buyerId },
    relations: ['product', 'accepted_offer', 'delivery', 'buyer', 'seller'],
    skip: (page - 1) * limit,
    take: limit,
    order: { created_at: 'DESC' }, // Optional: newest orders first
  });

  return {
    message: 'Orders retrieved successfully!',
    status: 'success',
    statusCode: 200,
    data: orders,
    pagination: pagination({page:page,limit:limit,total})
  };
}


async findOrder(
 query:{ buyer_id ?: string,seller_id?:string,product_id?:number ,id?:number ,paymentStatus?:PaymentStatus,offer_id?:number ,delivery_id?:number,status?:OrderStatus }
): Promise<Order> {
  const orders = await this.orderRepository.findOne({
    where: query,
    relations: ['product', 'accepted_offer', 'delivery', 'buyer', 'seller','shipments'],
    order: { created_at: 'DESC' }, // Optional: newest orders first
  });
  if(!orders){
    throw new Error('Order not found');
  }
  return orders;
}
async findBySellerId(
  sellerId: string,
  page :number =1,
  limit :number = 10,
):Promise<ResponseInterface<Order[]>> {
  const [orders, total] = await this.orderRepository.findAndCount({
    where: { seller_id: sellerId },
    relations: ['product', 'accepted_offer', 'delivery', 'buyer', 'seller'],
    skip: (page - 1) * limit,
    take: limit,
    order: { created_at: 'DESC' },
  });
// orsers

  return {
    message: 'Orders retrieved successfully!',
    status: 'success',
    statusCode: 200,
    data: orders,
    pagination: pagination({page:page,limit:limit,total})
    }

    
}

async purchaseOrder({product_id,user}:{product_id:number,user:User}){
  try{
    const product = await this.productRepository.findOne({where:{id:product_id,},relations:['user']})
    if(product.user.id === user.id){
      throw new ForbiddenException("You can't purchase your own product!")
    }
    if(product.status === ProductStatus.SOLD){
      throw new BadRequestException("Product already sold")
    }
    if(product.status !== ProductStatus.AVAILABLE){
      throw new ForbiddenException("Product is no longer available to purchase .")
    }

    const wallets = await this.walletRepository.findOne({where:{user_id:user.id}})
    const productSellingPrice = Number(product.selling_price)
    if(isNaN(productSellingPrice)){
      product.status = ProductStatus.PENDING
      await this.productRepository.save(product)
      throw new BadRequestException("Product is not sellable")
    }
    if(wallets.balance < productSellingPrice){
      throw new BadRequestException("You don't have enough balance to purchase the product . Please recharge you account or make payment .")
    }
    // const uniqueTransectionNumber =Math.floor(Math.random() * 1000000)
     const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  product.status = ProductStatus.IN_PROGRESS


  const order = new Order()
  order.product = product 
  order.buyer = user
  order.seller = product.user
  order.buyer_id = user.id
  order.seller_id = product.user.id
  order.offer_id = null
  order.accepted_offer = null
  order.status = OrderStatus.PENDING
  
  await queryRunner.manager.save(Order,order)

  // const transection = new Transections()
  // transection.product = product
  // transection.amount = productSellingPrice
  // transection.status = PaymentStatus.DUE_DELIVERY
  // transection.paymentId = `Trans-${product.id}-${uniqueTransectionNumber}`
  // transection.paymentMethod ="Internal"
  // transection.transection_type = TransectionType.PHURCASE
  // transection.order = order

  await queryRunner.manager.save(Product, product)

  }catch(error){

  }
}
}

