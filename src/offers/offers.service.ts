import { InjectRepository } from "@nestjs/typeorm";
import { Offer } from "./entities/offer.entity";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { ProductsService } from "src/products/products.service";
import { OrdersService } from "src/orders/orders.service";
import { OfferStatus } from "./enums/offerStatus.enum";
import {Order} from  "../orders/entities/order.entity"
import { SendOfferDto } from "./dto/sendOffer.dto";
import { ResponseInterface } from "src/common/types/responseInterface";
import { ConversationsService } from "src/conversations/conversations.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { NotificationAction, NotificationRelated } from "src/notifications/entities/notifications.entity";
import { UserRoles } from "src/user/enums/role.enum";
import { MessagesService } from "src/messages/messages.service";

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    private readonly productService: ProductsService,
    private readonly orderService: OrdersService, // delegate order creation
    private readonly coversationService: ConversationsService,
    private readonly notificationService: NotificationsService
  ) {}

  async createOffer(payload:SendOfferDto): Promise<ResponseInterface<Offer>> {
    const {buyer_id,product_id,price}=payload
    
    const product = await this.productService.findByIdWithSeller(product_id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.user_id === buyer_id) {
      throw new BadRequestException('You cannot make an offer on your own product');
    }

    const offer = this.offerRepo.create({
      buyer_id: buyer_id,
      seller_id: product.user_id,
      product_id: product.id,
      price,
      status: OfferStatus.PENDING,
    });
    await this.offerRepo.save(offer)
   const conversation = await this.coversationService.getOrCreate({productId:product.id,userIds:[product.user_id , buyer_id],offer:offer,offerType:OfferStatus.PENDING})
  //  console.log(conversation)
await this.notificationService.createNotification({
  userId:product.user_id,
  related:NotificationRelated.CONVERSATION,
  action:NotificationAction.CREATED,
  msg:`${product.product_name} has a new offer for your review!`,
  targetId:conversation.id,
  isImportant:true,
  notificationFor:UserRoles.USER
})

    return {message:"Offer sent Successfully!",status:'success',statusCode:201,data:offer}
  } 
 
  async acceptOffer({offerId, sellerId}:{offerId:number;sellerId:string}): Promise<ResponseInterface<Order>> {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['product','buyer','seller'],
    });
    if(offer.status === OfferStatus.ACCEPTED){
      throw new BadRequestException("Offer already accepted!")
    }
    if(offer.status === OfferStatus.REJECTED){
      throw new BadRequestException("Offer already rejected!")
    }
    if (!offer) {
      throw new NotFoundException('Offer not found!');
    }

    const product = offer.product;
    if (product.user_id !== sellerId) {
      throw new ForbiddenException('You are not the owner of the product');
    }

   
    await this.offerRepo.save(offer);
     const conversation = await this.coversationService.getOrCreate({productId:product.id,userIds:[product.user_id , offer.seller.id],offer:offer,offerType:OfferStatus.ACCEPTED})
await this.notificationService.createNotification({
  userId:offer.seller.id,
  related:NotificationRelated.CONVERSATION,
  action:NotificationAction.UPDATED,
  msg:`Offer accepted for ${product.product_name} ! Feel Free to phurcase that . `,
  targetId:conversation.id,
  isImportant:true,
  notificationFor:UserRoles.USER
}) 
offer.status = OfferStatus.ACCEPTED;
 await this.offerRepo.save(offer);
    return {message:"Offer accepted successfully",status:'success',statusCode:201,data: await this.orderService.createOrderFromOffer(offer)};
  }

  async rejectOffer({ offerId, sellerId }: { offerId: number; sellerId: string }): Promise<ResponseInterface<Order>> {
  // Find the offer by ID and load relations
  const offer = await this.offerRepo.findOne({
    where: { id: offerId },
    relations: ['product', 'buyer', 'seller'],
  });

  // Check if the offer status is already rejected
  if (offer.status === OfferStatus.REJECTED) {
    throw new BadRequestException('Offer already rejected!');
  }

  // Check if the offer is accepted
  if (offer.status === OfferStatus.ACCEPTED) {
    throw new BadRequestException('Offer already accepted!');
  }

  // If offer is not found
  if (!offer) {
    throw new NotFoundException('Offer not found!');
  }

  // Check if the logged-in user is the seller of the product
  const product = offer.product;
  if (product.user_id !== sellerId) {
    throw new ForbiddenException('You are not the owner of the product');
  }

  // Set the offer status to rejected
  offer.status = OfferStatus.REJECTED;
  const [savedOffer,conversation] = await Promise.all([this.offerRepo.save(offer),this.coversationService.getOrCreate({productId:product.id, userIds:[product.user_id, offer.seller.id],offer:offer,offerType:OfferStatus.REJECTED})])
  await this.notificationService.createNotification({
    userId: offer.seller.id,
    related: NotificationRelated.CONVERSATION,
    action: NotificationAction.UPDATED,
    msg: `Your offer for ${product.product_name} has been rejected by the seller.`,
    targetId: conversation.id,
    isImportant: true,
    notificationFor: UserRoles.USER,
  });

     

 
  // Respond with success and order details
  return {
    message: 'Offer rejected successfully',
    status: 'success',
    statusCode: 200,
    data: null,  // You can return null or additional data depending on the requirements
  };
}
}
