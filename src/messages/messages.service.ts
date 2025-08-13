import { Injectable } from '@nestjs/common';
import { Messages } from './entities/messages.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversations } from 'src/conversations/entities/conversations.entity';
import { User } from 'src/user/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { AttachmentService } from 'src/attachment/attachment.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { UserService } from 'src/user/user.service';

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

    return this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['attachments', 'sender'],
    });
  }

  async getMessages(conversationId: number): Promise<Messages[]> {
    return this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'attachments'],
      order: { created_at: 'ASC' },
    });
  }
}
