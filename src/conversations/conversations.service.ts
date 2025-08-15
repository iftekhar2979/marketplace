
import { BadRequestException, Injectable } from '@nestjs/common';
import { Conversations } from './entities/conversations.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ParticipantsService } from 'src/participants/participants.service';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { ProductsService } from 'src/products/products.service';
import { UserService } from 'src/user/user.service';
import {Product} from 'src/products/entities/products.entity'
import { pagination } from 'src/shared/utils/pagination';
import { Messages } from 'src/messages/entities/messages.entity';
import { Offer } from 'src/offers/entities/offer.entity';
import { OfferStatus } from 'src/offers/enums/offerStatus.enum';
import { number } from 'joi';
@Injectable()
export class ConversationsService {
    constructor(
    @InjectRepository(Conversations)
    private conversationRepo: Repository<Conversations>,
@InjectRepository(Messages) private messageRepo: Repository<Messages>,
    private readonly participantService: ParticipantsService,
    private readonly productService: ProductsService,
    private readonly userService:UserService,
     private readonly dataSource: DataSource, 
  ) {}

  async getConversationId(conversationId:number){
   return await this.conversationRepo.findOneByOrFail({ id: conversationId })
  }
  async createConversation({product,users}:{product:Product,users:User[]}){
    console.log(product)
    const conversation = this.conversationRepo.create({
      name: `${product.product_name} (${users.map((u) => u.firstName).join(' - ')})`,
      image:`${product.images[0].image}`,
      product,
    });
    console.log(conversation)
return await this.conversationRepo.save(conversation);

  }
  async updatedConversation({conversation_id,conversation,message}:{conversation_id:number,conversation?: Partial<Conversations>,message:Messages}){
    const chat = await this.getConversationId(conversation_id)
    if(message && conversation_id){
      chat.lastmsg = message
    }
    if(conversation){
      if(conversation.image){
        chat.image = conversation.image
      }
      if(conversation.name){
        chat.name= conversation.name
      }

    }
return await this.conversationRepo.save(chat);

  }
  async offerStatusHandle({offer,existingConversation,offerType}:{offer:Offer,existingConversation:Conversations,offerType:OfferStatus}){
if(offerType === OfferStatus.PENDING){
      await this.messageRepo.insert({
        sender_id: offer.buyer_id,
        isRead: false,
        msg: `Current Price : ${existingConversation.product.selling_price} \n Offer Price : ${offer.price}`,
        offer_id: offer.id,
        type: 'offer',
        conversation: existingConversation
      });

    }else if(offerType === OfferStatus.ACCEPTED){
await this.messageRepo.insert({
        sender_id: offer.seller_id,
        isRead: false,
        msg: `Offer Price : ${offer.price} is accepted`,
        offer_id: offer.id,
        type: 'offer',
        conversation: existingConversation
      });
    }else{
      await this.messageRepo.insert({
        sender_id: offer.seller_id,
        isRead: false,
        msg: `Sorry , Offer Price : ${offer.price} is rejected .`,
        offer_id: offer.id,
        type: 'offer',
        conversation: existingConversation
      });
    }
  }
async getOrCreate({productId, userIds, offer,offerType}:{productId: number, userIds: string[], offer: Offer,offerType:OfferStatus}): Promise<Conversations> {
  const existing = await this.participantService.checkChatAlreadyExist({
    product_id: productId,
    user_ids: userIds
  });

  // Case: Conversation already exists
  if (existing.length === 2) {
    const existingConversation = await this.conversationRepo.findOne({
      where: { product: { id: productId } },
      relations: ['participants', 'product']
    });
    
await this.offerStatusHandle({offer,existingConversation,offerType})
    return existingConversation;
  }

  // Case: New conversation - use transaction
  return await this.dataSource.transaction(async manager => {
    const product = await this.productService.getProduct(productId);
    if (!product) {
      throw new BadRequestException('No Product Found with that reference!');
    }

    this.productService.checkProductStatus(product.status);

    const users = await this.userService.getMultipleUserByIds(userIds);

    // Create conversation using transactional entity manager
    const savedConversation = await manager.save(Conversations, {
      product,
      participants: [],
    });

    // Add participants
    await this.participantService.addMultiple(savedConversation, users, product, manager);

    // Save message
    await manager.insert(Messages, {
      sender_id: offer.buyer_id,
      isRead: false,
      msg: `Current Price : ${product.selling_price} \n Offer Price : ${offer.price}`,
      type: 'offer',
      conversation: savedConversation
    });

    return savedConversation;
  });
}
   async getAllConversations(user_id:string,page: number, limit: number) {
        // Calculate the skip and take for pagination
        const skip = (page - 1) * limit;
        const take = limit;

        // Get total number of conversations
       const [conversations, total] = await this.conversationRepo.createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participants', 'participant',)
        .leftJoin('participant.user', 'user') // 👈 Do not auto-select full user
        .leftJoinAndSelect('conversation.lastmsg', 'lastmsg') 
        .addSelect([
          'user.id',
          'user.firstName',
          'user.email',
          'user.isActive'
        ])
        .where('user.id = :user_id', { user_id })
        .skip(skip)
        .take(take)
        .getManyAndCount();

          return {
            message: 'Conversations retrieved successfully',
            statusCode: 200,
            data: conversations,
            pagination: pagination({page ,limit,total})
        };
    }
}
