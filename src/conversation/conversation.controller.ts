import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { getCurrentUser } from 'src/common/decorators';

@Controller('conversation')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Post('create/:targetId')
  async createConversation(
    @getCurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    return await this.conversationService.createConversation(userId, targetId);
  }

  @Get('count')
  async getConversationCount(@getCurrentUser('id') userId: string) {
    return await this.conversationService.getTotalUnreadCount(userId);
  }

  @Get('loadPreview')
  async loadAllConversations(@getCurrentUser('id') userId: string) {
    return await this.conversationService.getAllConversations(userId);
  }

  @Get(':conversationId')
  async loadConversation(
    @getCurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return await this.conversationService.getConversation(
      conversationId,
      userId,
    );
  }

  @Delete(':conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @getCurrentUser('id') userId: string,
  ) {
    return await this.conversationService.deleteConversation(
      conversationId,
      userId,
    );
  }
}
