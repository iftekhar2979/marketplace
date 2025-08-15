import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { MessageEligabilityGuard } from './decorators/message-eligability.guard';
import { GetReceiver } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('messages')
export class MessagesController {

  constructor(private readonly messagesService: MessagesService) {}

    @Get(':id')
    @UseGuards(JwtAuthenticationGuard, MessageEligabilityGuard)
  async getMessages(
    @GetReceiver() receiver:User,
    @Param('id') conversationId: number,  // conversationId is required
    @Query('page') page: number = 1,  // Default to page 1
    @Query('limit') limit: number = 10,  // Default to limit 10
  ) {
    console.log(receiver)
    const response = await this.messagesService.getMessages({
      conversationId,
      receiver,
      page,
      limit,
    });
    return response;
  }
}
