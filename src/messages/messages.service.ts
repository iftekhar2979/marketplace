import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class MessagesService {

    constructor(
    @InjectRepository(Messages)
    private messageRepo: Repository<Messages>,
    private readonly conversationService:ConversationsService,
    private readonly userService: UserService,
    private readonly attachmentService: AttachmentService,
 private readonly socketService:SocketService,
    @InjectLogger() private readonly logger: Logger
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<Messages> {
    try{
      const conversation = await this.conversationService.getConversationId(dto.conversation_id);
      const message = this.messageRepo.create({
        msg: dto.msg,
        type:dto.type ? dto.type : 'text',
        sender:dto.sender,
        conversation,
        isRead:false
      });
      
      this.logger.log("Message Service",message)
      const savedMessage = await this.messageRepo.save(message);
      
      if (dto.attachments?.length) {
        await this.attachmentService.addAttachments(savedMessage, dto.attachments);
        return this.messageRepo.findOneOrFail({where:{id:savedMessage.id},relations:["attachments"]})
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
 async sendFileAsMessageWithRest(
   {conversation_id,user,file,receiver}:{
    conversation_id: number,
    receiver: User,
    user:User,
    file: Express.Multer.File[]}
  ) {
      // console.log(this.socketService.connectedUsers);
      if (file.length < 1) {
        throw new BadRequestException('Please select a file to send');
      }
      // console.log(file);
      const images = file.map((singleFile) => {
        return {
          file_url: `${singleFile.destination.slice(7, singleFile.destination.length)}/${singleFile.filename}`,
          type: singleFile.mimetype,
        };
      });
      let msgType: 'image' | 'video' =
        images[0].type.includes('image') ||
        images[0].type.includes('octet-stream')
          ? 'image'
          : 'video';

     const msg= await this.sendMessage({conversation_id,sender:user,attachments:images,type:msgType})
    //  console.log("first")
      await this.conversationService.updatedConversation({conversation_id,message:msg})
      let receiverSocket = this.socketService.getSocketByUserId(receiver.id);
    // console.log(this.socketService)
    let senderSocket = this.socketService.getSocketByUserId(user.id);
      if(receiverSocket){
        receiverSocket.emit(`conversation-${conversation_id}`,msg)
      }
      if(senderSocket){
        senderSocket.emit(`conversation-${conversation_id}`,msg)
      }
      return msg
    
  }
   async getMessages({
    conversationId,
    conversation,
    receiver,
    page = 1,
    limit = 10,
  }:{conversationId:number,receiver:Partial<User>,conversation:Conversations,page:number,limit:number}): Promise<ResponseInterface<{receiver:Partial<User>,conversation:Conversations,messages:Messages[]}>> {
    const skip = (page - 1) * limit;
    const take = limit;
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: [ 'attachments','offer'], 
      order: { created_at: 'DESC' },  
      // skip: skip,
      // take: take,
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
      data:{receiver,conversation, messages},
      pagination : pagination({page,limit,total}),
    };
  }
}
