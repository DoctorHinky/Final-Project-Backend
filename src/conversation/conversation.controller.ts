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
    await this.conversationService.createConversation(userId, targetId);
  }

  @Get(':conversationId')
  async loadConversation(
    @getCurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    await this.conversationService.getConversation(conversationId, userId);
  }

  @Get('loadPreview')
  async loadAllConversations(@getCurrentUser('id') userId: string) {
    await this.conversationService.getAllConversations(userId);
  }

  @Delete(':conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @getCurrentUser('id') userId: string,
  ) {
    await this.conversationService.deleteConversation(conversationId, userId);
  }
}
