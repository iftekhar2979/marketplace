import { Injectable, NotFoundException } from '@nestjs/common';
import { Messages } from './entities/messages.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversations } from 'src/conversations/entities/conversations.entity';
import { User } from 'src/user/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { AttachmentService } from 'src/attachment/attachment.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { UserService } from 'src/user/user.service';
import { Pagination, pagination } from 'src/shared/utils/pagination';
import { ResponseInterface } from 'src/common/types/responseInterface';
import { InjectLogger } from 'src/shared/decorators/logger.decorator';
import { Logger } from 'winston';

@Injectable()
export class MessagesService {

    constructor(
    @InjectRepository(Messages)
    private messageRepo: Repository<Messages>,
    private readonly conversationService:ConversationsService,
    private readonly userService: UserService,
    private readonly attachmentService: AttachmentService,
    @InjectLogger() private readonly logger: Logger
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<Messages> {
    try{
      const conversation = await this.conversationService.getConversationId(dto.conversation_id);
      const message = this.messageRepo.create({
        msg: dto.msg,
        sender:dto.sender,
        conversation,
        isRead:false
      });
      
      this.logger.log("Message Service",message)
      const savedMessage = await this.messageRepo.save(message);
      
      if (dto.attachments?.length) {
        await this.attachmentService.addAttachments(savedMessage, dto.attachments);
      }
      
      return savedMessage
    }catch(error){
      console.log(error)
    }
    }
  async seenMessages({ conversation_id }: { conversation_id: number }) {
  const updateResult = await this.messageRepo
    .createQueryBuilder()
    .update(Messages)
    .set({ isRead: true })
    .where('conversation_id = :conversation_id', { conversation_id })
    .andWhere('isRead = false')
    .execute();

  return {
    message: `${updateResult.affected} message(s) marked as read`,
  
  };
}

   async getMessages({
    conversationId,
    receiver,
    page = 1,
    limit = 10,
  }:{conversationId:number,receiver:Partial<User>,page:number,limit:number}): Promise<ResponseInterface<{receiver:Partial<User>,messages:Messages[]}>> {
    // Calculate skip and take based on page and limit
    const skip = (page - 1) * limit;
    const take = limit;

    // Query to get the messages with the required relations
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: [ 'attachments',], 
      order: { created_at: 'DESC' },  // Ordering by created_at
      skip: skip, // Skip for pagination
      take: take, // Limit the number of messages returned
    });
    const lastmsg =messages[messages.length-1]
    // console.log(receiver, messages[messages.length-1].sender_id)
    if(receiver.id !== lastmsg.sender_id){
      console.log("receiver and lastmsg sender are not same")
      await this.seenMessages({conversation_id:conversationId})
    }

    // If no messages are found
    if (messages.length === 0) {
      throw new NotFoundException('No messages found for this conversation');
    }
    return {
      status:"success",
      message:"Messages retrived successfully",
      statusCode:200,
      data:{receiver, messages},
      pagination : pagination({page,limit,total}),
    };
  }
}
