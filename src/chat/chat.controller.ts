import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { getCurrentUser } from 'src/common/decorators';
import { NewMessageDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('send/:chatId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: memoryStorage(), // Use memory storage for file uploads (not good but no other option),
    }),
  )
  async sendAMessage(
    @getCurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: NewMessageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    await this.chatService.sendMessage(chatId, userId, { ...dto, file });
  }

  @Patch('update/:messageId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: memoryStorage(), // Use memory storage for file uploads (not good but no other option),
    }),
  )
  async updateMessage(
    @getCurrentUser('id') userId: string,
    @Param('messageId') msgId: string,
    @Body() dto: NewMessageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    await this.chatService.updateMessage(userId, msgId, { ...dto, file });
  }

  @Delete(':msgId')
  async deleteMessage(
    @getCurrentUser('id') userId: string,
    @Param('msgId') msgId: string,
  ) {
    await this.chatService.deleteMessage(userId, msgId);
  }
}
