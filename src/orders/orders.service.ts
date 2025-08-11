import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { Offer } from 'src/offers/entities/offer.entity';
import { OrderStatus, PaymentStatus } from './enums/orderStatus';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private orderRepository: Repository<Order>
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
    // product: offer.product,
    //  product_id: offer.product.id,
    accepted_offer: offer,
    offer_id: offer.id,
    delivery: null,
    delivery_id: null,
  });

  return await this.orderRepository.save(order);
}

    
}
