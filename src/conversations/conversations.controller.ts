import { Controller, Get, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {

      constructor(
    private readonly conversationService: ConversationsService,
  ) {}

  @Get()
  async getConversations(
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 10, // Default to limit 10
  ){
    // Call the repository method to get paginated conversations
    return this.conversationService.getAllConversations(page, limit);
  }
}

