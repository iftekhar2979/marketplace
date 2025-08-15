
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { Offer } from 'src/offers/entities/offer.entity';
import { OrderStatus, PaymentStatus } from './enums/orderStatus';
import { ResponseInterface } from "src/common/types/responseInterface";
import { pagination } from 'src/shared/utils/pagination';
import { NotificationAction, NotificationRelated, Notifications, NotificationType } from 'src/notifications/entities/notifications.entity';
import { UserRoles } from 'src/user/enums/role.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>,
    private readonly notificaionService:NotificationsService
      ){}
async createOrderFromOffer(offer: Offer): Promise<Order> {
  console.log(offer)
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
const productName = offer.product.product_name
  const notifications =[
    {

    userId: offer.buyer.id,
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
    targetId: offer.order.id,
    msg: `#${offer.order.id} both are agreed with negotiation!`
  }
]
await this.notificaionService.bulkInsertNotifications(notifications)
  return await this.orderRepository.save(order);
}

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

  return {
    message: 'Orders retrieved successfully!',
    status: 'success',
    statusCode: 200,
    data: orders,
    pagination: pagination({page:page,limit:limit,total})
    }

    
}
}