import { BadRequestException, Injectable } from '@nestjs/common';
import { Conversations } from './entities/conversations.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ParticipantsService } from 'src/participants/participants.service';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { ProductsService } from 'src/products/products.service';
import { UserService } from 'src/user/user.service';
import {Product} from 'src/products/entities/products.entity'
import { pagination } from 'src/shared/utils/pagination';
@Injectable()
export class ConversationsService {

    constructor(
    @InjectRepository(Conversations)
    private conversationRepo: Repository<Conversations>,

    private readonly participantService: ParticipantsService,
    private readonly productService: ProductsService,
    private readonly userService:UserService
  ) {}

  async getConversationId(conversationId:number){
   return await this.conversationRepo.findOneByOrFail({ id: conversationId })
  }
  async createConversation({product,users}:{product:Product,users:User[]}){
    const conversation = this.conversationRepo.create({
      name: `${product.product_name} (${users.map((u) => u.firstName).join(' - ')})`,
      product,
    });
    console.log(conversation)
return await this.conversationRepo.save(conversation);

  }
  async getOrCreate(productId: number, userIds: string[]): Promise<Conversations> {
    const existing = await this.participantService.checkChatAlreadyExist({product_id:productId,user_ids:userIds})
    console.log(existing)
    if (existing.length === 2){
        return await this. conversationRepo.findOne({
      where: { product: { id: productId } },
      relations: ['participants', 'product'],
    });
    } 
    
    const product = await this.productService.getProduct(productId)
    console.log("Product",product)
    if(!product){
        throw new BadRequestException("No Product Found with that reference!")
    }
    this.productService.checkProductStatus(product.status)
    const users = await this.userService.getMultipleUserByIds(userIds)
   const saved = await this.createConversation({product,users})
//    console.log(saved.product)
    await this.participantService.addMultiple(saved, users,product);
    return saved;
  }

   async getAllConversations(page: number, limit: number) {
        // Calculate the skip and take for pagination
        const skip = (page - 1) * limit;
        const take = limit;

        // Get total number of conversations
        const [conversations, total] = await this.conversationRepo.createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.participants', 'participant')
            .leftJoinAndSelect('participant.user', 'user')
            .leftJoinAndSelect('conversation.product', 'product')
            .leftJoinAndSelect('product.images', 'images')
            .skip(skip)
            .take(take)
            .getManyAndCount();

        // Calculate total pages
        const totalPages = Math.ceil(total / limit)

          return {
            message: 'Conversations retrieved successfully',
            statusCode: 200,
            data: conversations,
            pagination: pagination({page ,limit,total})
        };
    }
}
