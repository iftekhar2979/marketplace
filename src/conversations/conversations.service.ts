
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { SocketService } from 'src/socket/socket.service';
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
     private readonly socketService:SocketService
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
    if(!chat){
      throw new NotFoundException("Conversation not found")
    }
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
      if(conversation.lastmsg){
        chat.lastmsg = conversation.lastmsg
      }

    }
    console.log("Is the conversation",conversation)
return await this.conversationRepo.save(chat);

  }
  async offerStatusHandle({offer,existingConversation,offerType}:{offer:Offer,existingConversation:Conversations,offerType:OfferStatus}){
if(offerType === OfferStatus.PENDING){
     const msg = this.messageRepo.create({
        sender_id: offer.buyer_id,
        isRead: false,
        msg: `Current Price : ${existingConversation.product.selling_price} \n Offer Price : ${offer.price}`,
        offer_id: offer.id,
        offer:offer,
        type: 'offer',
        conversation: existingConversation
      });
      await this.messageRepo.save(msg)
      delete msg.offer.buyer
      delete msg.offer.seller
      delete msg.offer.product
      console.log("Existing Conversation",existingConversation)
this.socketService.handleMessageDelivery({senderId:offer.buyer_id,receiverId:offer.seller_id,conversation_id:existingConversation.id,message:msg})
    }else if(offerType === OfferStatus.ACCEPTED){
      console.log(offerType)
const msg= this.messageRepo.create({
        sender_id: offer.seller_id,
        isRead: false,
        msg: `Offer Price : ${offer.price} is accepted`,
        offer_id: offer.id,
        offer:offer,
        type: 'offer',
        conversation: existingConversation
      });
      await this.messageRepo.save(msg)
      // console.log(msg)
      this.socketService.handleMessageDelivery({senderId:offer.buyer_id,receiverId:offer.seller_id,conversation_id:existingConversation.id,message:msg})
    }else{
      console.log(offerType)
    const msg = this.messageRepo.create({
        sender_id: offer.seller_id,
        isRead: false,
        msg: `Sorry , Offer Price : ${offer.price} is rejected .`,
        offer_id: offer.id,
        offer:offer,
        type: 'offer',
        conversation: existingConversation
      });
        await this.messageRepo.save(msg)
      this.socketService.handleMessageDelivery({senderId:offer.buyer_id,receiverId:offer.seller_id,conversation_id:existingConversation.id,message:msg})
    }
  }
  
async getOrCreate({productId, userIds, offer,offerType}:{productId: number, userIds: string[], offer: Offer,offerType:OfferStatus}): Promise<Conversations> {
  try{

  
  const existing = await this.participantService.checkChatAlreadyExist({
    product_id: productId,
    user_ids: userIds
  });
  // console.log(existing)
  // Case: Conversation already exists
  if (existing.length > 1) {
    const existingConversation = await this.conversationRepo.findOne({
      where: { product: { id: productId } },
      relations: ['participants', 'product']
    });
    // console.log(existingConversation) 
    // console.warn("Existing Conversation")
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
      name: `${product.product_name} (${users.map(u => u.firstName).join(' - ')})`,
      image: product.images[0]?.image || null,
      lastmsg: null, 
    });

    // Add participants
    await this.participantService.addMultiple(savedConversation, users, product, manager);

  
    // Save message
   const msg = await manager.create(Messages, {
      sender_id: offer.buyer_id,
      isRead: false,
      msg: `Current Price : ${product.selling_price} \n Offer Price : ${offer.price}`,
      type: 'offer',
      offer_id:offer.id,
      offer:offer,
      conversation: savedConversation
    });
    savedConversation.lastmsg = msg
    await manager.save(msg)
    console.log(msg)
   await manager.save(Conversations,savedConversation);
  // await this.updatedConversation({conversation_id:savedConversation.id , message:msg ,conversation:{lastmsg:msg}})
    this.socketService.handleMessageDelivery({senderId:offer.buyer_id,receiverId:offer.seller_id,conversation_id:savedConversation.id,message:msg})

    return savedConversation;
  });
   }catch(error){
    console.log(error)
    throw new BadRequestException("Error in fetching existing conversation")
  }
}
  async getAllConversations(user_id: string, page: number, limit: number) {
  try {
    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch conversations with necessary relations and apply pagination
    const [conversations, total] = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.product', 'product')
      .leftJoin('participant.user', 'user')  // Join with user but don't auto-select full user
      .leftJoinAndSelect('conversation.lastmsg', 'lastmsg') // Join with last message
      .addSelect([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.image',
        'user.email',
        'user.isActive',
   
      ])  // Only select necessary fields from user
      .where('user.id = :user_id', { user_id }) // Filter conversations where user.id is not equal to provided user_id
      .skip(skip) // Apply pagination
      .take(take)
      .getManyAndCount();

    // Process the conversations to include only other participants (exclude logged-in user)
   
    // Prepare the response object
    const response = {
      message: 'Conversations retrieved successfully',
      statusCode: 200,
      data: conversations,  // Include the filtered conversations
      pagination: pagination({ page, limit, total }),  // Ensure pagination details
    };

    return response;
  } catch (error) {
    // Handle any unexpected errors and provide a descriptive message
    console.error('Error fetching conversations:', error);
    throw new Error('Unable to retrieve conversations at this time.');
  }
}
}
