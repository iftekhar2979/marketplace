import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';

@Controller('conversations')
export class ConversationsController {

      constructor(
    private readonly conversationService: ConversationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthenticationGuard)
  async getConversations(
    @GetUser() user:User,
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 10, // Default to limit 10
  ){
    // Call the repository method to get paginated conversations
    return this.conversationService.getAllConversations(user.id,page, limit);
  }
}

