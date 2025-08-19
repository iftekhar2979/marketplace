import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { MessageEligabilityGuard } from './decorators/message-eligability.guard';
import { GetReceiver, GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/common/multer/multer.config';
import { SocketService } from 'src/socket/socket.service';

@Controller('messages')
export class MessagesController {

  constructor(private readonly messagesService: MessagesService ,
  // private readonly socketService:SocketService
  ) {}

    @Get(':id')
    @UseGuards(JwtAuthenticationGuard, MessageEligabilityGuard)
     
  async getMessages(
    @GetReceiver() receiver:User,
    @Param('id') conversationId: number,  // conversationId is required
    @Query('page') page: number = 1,  // Default to page 1
    @Query('limit') limit: number = 10,  // Default to limit 10
       
        // @GetFilesDestination() filesDestination: string[],
  ) {
    const response = await this.messagesService.getMessages({
      conversationId,
      receiver,
      page,
      limit,
    });
    return response;
  }
    @Post('file')
    @UseGuards(JwtAuthenticationGuard, MessageEligabilityGuard)
     @UseInterceptors( FileFieldsInterceptor(
          [
            { name: 'images', maxCount: 6 }, // You can limit the number of files here
          ],
          multerConfig,
        ),)
  async sendFile(
    @GetReceiver() receiver:User,
    @Body() body:{conversationId:string},
    @GetUser() user:User,
     @UploadedFiles() files: { images?: Express.Multer.File[] },
      //  @GetReceiver() receiver:User,
  ) {
    if(!receiver){
      throw new BadRequestException("Receiver not found!")
    }
    const conversationId=  body.conversationId
    const response = await this.messagesService.sendFileAsMessageWithRest({conversation_id:parseFloat(conversationId),user,receiver,file:files.images
    });
   
    return response;
  }
}
