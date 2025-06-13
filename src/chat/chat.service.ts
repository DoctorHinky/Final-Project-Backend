import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewMessageDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MessageType } from '@prisma/client';
import { encrypt } from 'src/common/utilitys/encryptoin';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  static DELETE_MESSAGE = 'Die Nachricht wurde gelöscht';

  private evalType(
    data: NewMessageDto & { file?: Express.Multer.File | undefined },
  ): MessageType {
    if (data.message && data.file) {
      return MessageType.COMBINED;
    } else if (data.message && !data.file) {
      return MessageType.TEXT;
    } else if (!data.message && data.file) {
      return MessageType.FILE;
    } else {
      throw new BadRequestException('Message and file cannot both be empty');
    }
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    data: NewMessageDto & { file?: Express.Multer.File | undefined },
  ) {
    try {
      const { message, file } = data;
      if (!message && !file) {
        throw new BadRequestException('Message should not be empty');
      }

      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id: conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      let fileUrl: string | null = null;
      let fileId: string | null = null;
      if (file) {
        const uploadResult = await this.cloudinary.uploadFile(
          file,
          'chat_files',
        );
        if (
          !uploadResult ||
          !uploadResult.secure_url ||
          !uploadResult.public_id
        ) {
          throw new BadRequestException('File upload failed');
        }

        // Hier wird angenommen, dass das Upload-Ergebnis eine URL enthält
        fileUrl = uploadResult.secure_url;
        fileId = uploadResult.public_id;
      }

      const newMsg = await this.prisma.directMessage.create({
        data: {
          content: message ? encrypt(message) : null,
          attachmentUrl: fileUrl,
          attachmentPublicId: fileId,
          messageType: this.evalType(data),
          conversationId,
          senderId: userId,
        },
      });

      console.log('Message sent successfully:', newMsg);

      return { message: 'message createt', data: newMsg };
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error instanceof HttpException) {
        throw error; // Weiterwerfen für den Controller
      } else {
        throw new BadRequestException(
          'Failed to send message. Please try again later.',
          { cause: error },
        );
      }
    }
  }

  async updateMessage(
    userId: string,
    messageId: string,
    data: NewMessageDto & { file?: Express.Multer.File | undefined },
  ) {
    try {
      const message = await this.prisma.directMessage.findUnique({
        where: { id: messageId, senderId: userId },
      });
      if (!message) {
        throw new NotFoundException(
          'Message not found or you are not the sender',
        );
      }
      const type = this.evalType(data);

      if (message.content === ChatService.DELETE_MESSAGE) {
        throw new BadRequestException('Cannot update a deleted message');
      }

      if (message.createdAt < new Date(Date.now() - 5 * 60 * 1000)) {
        throw new BadRequestException(
          'You can only update messages within 5 minutes of sending them',
        );
      }

      let fileUrl: string | null = null;
      let fileId: string | null = null;

      if (data.file) {
        const uploadResult = await this.cloudinary.uploadFile(
          data.file,
          'chat_files',
        );
        if (
          !uploadResult ||
          !uploadResult.secure_url ||
          !uploadResult.public_id
        ) {
          throw new BadRequestException('File upload failed');
        }

        // Hier wird angenommen, dass das Upload-Ergebnis eine URL enthält
        fileUrl = uploadResult.secure_url;
        fileId = uploadResult.public_id;

        if (typeof message.attachmentPublicId === 'string') {
          await this.cloudinary.deleteFile(message.attachmentPublicId);
        }
      }
      const updatedMsg = await this.prisma.directMessage.update({
        where: { id: messageId },
        data: {
          content: data.message ?? message.content,
          attachmentUrl: fileUrl,
          attachmentPublicId: fileId,
          messageType: type,
        },
      });

      return updatedMsg;
    } catch (error) {
      console.error('Failed to update message:', error);
      if (error instanceof HttpException) {
        throw error; // Weiterwerfen für den Controller
      } else {
        throw new BadRequestException(
          'Failed to update message. Please try again later.',
          { cause: error },
        );
      }
    }
  }

  async deleteMessage(userId: string, messageId: string) {
    try {
      const message = await this.prisma.directMessage.findUnique({
        where: { id: messageId },
      });

      if (!message || !message.conversationId) {
        throw new NotFoundException("couldn't find message");
      }

      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id: message.conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!conversation) {
        throw new NotFoundException('You are not part of this conversation');
      }

      if (!message) throw new NotFoundException('Message not found');

      if (userId === message.senderId) {
        // Der Absender kann die Nachricht löschen
        if (typeof message.attachmentPublicId === 'string') {
          await this.cloudinary.deleteFile(message.attachmentPublicId);
        }
        await this.prisma.directMessage.update({
          where: { id: messageId },
          data: {
            content: ChatService.DELETE_MESSAGE,
            attachmentUrl: null,
            attachmentPublicId: null,
          },
        });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      if (error instanceof HttpException) {
        throw error; // Weiterwerfen für den Controller
      } else {
        throw new BadRequestException(
          'Failed to delete message. Please try again later.',
          { cause: error },
        );
      }
    }
  }

  async deleteMessageInternal(messageId: string) {
    try {
      const message = await this.prisma.directMessage.findUnique({
        where: { id: messageId },
      });
      if (message?.attachmentPublicId) {
        await this.cloudinary.deleteFile(message.attachmentPublicId);
      }
      return this.prisma.directMessage.delete({ where: { id: messageId } });
    } catch (error) {
      console.error('Failed to delete message internally:', error);
      throw error;
    }
  }
}
