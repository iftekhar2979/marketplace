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

@Injectable()
export class MessagesService {

    constructor(
    @InjectRepository(Messages)
    private messageRepo: Repository<Messages>,
    private readonly conversationService:ConversationsService,
    private readonly userService: UserService,
    private readonly attachmentService: AttachmentService
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<Messages> {
    const conversation = await this.conversationService.getConversationId(dto.conversationId);
    const sender = await this.userService.getUser(dto.senderId)
    const message = this.messageRepo.create({
      msg: dto.msg,
      sender,
      conversation,
    });

    const savedMessage = await this.messageRepo.save(message);

    if (dto.attachments?.length) {
      await this.attachmentService.addAttachments(savedMessage, dto.attachments);
    }

    return await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['attachments', 'sender'],
    });
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
      relations: [ 'attachments'],
      order: { created_at: 'ASC' },  // Ordering by created_at
      skip: skip, // Skip for pagination
      take: take, // Limit the number of messages returned
    });

    // If no messages are found
    if (messages.length === 0) {
      throw new NotFoundException('No messages found for this conversation');
    }

    // Calculate total pages for pagination
    const totalPages = Math.ceil(total / limit);

    // Construct the pagination object
   

    return {
      status:"success",
      message:"Messages retrived successfully",
      statusCode:200,
      data:{receiver, messages},
      pagination : pagination({page,limit,total}),
    };
  }
}
