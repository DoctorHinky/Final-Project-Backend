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
import { decrypt, encrypt } from 'src/common/utilitys/encryptoin';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private notificationService: NotificationService,
  ) {}

  static DELETE_MESSAGE = 'Die Nachricht wurde gelöscht';

  private evalType(
    data: NewMessageDto & { file?: Express.Multer.File | undefined },
  ): MessageType {
    const hasText = !!data.message?.trim();
    const hasFile = !!data.file;

    if (hasText && hasFile) return MessageType.COMBINED;
    if (hasText) return MessageType.TEXT;
    if (hasFile) return MessageType.FILE;

    throw new BadRequestException('Message should not be empty');
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    data: NewMessageDto & { file?: Express.Multer.File | undefined },
  ) {
    try {
      const { message, file } = data;
      const type = this.evalType(data);

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      const theOther =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;
      const other = await this.prisma.user.findUnique({
        where: { id: theOther },
        select: { username: true },
      });

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
          messageType: type,
          conversationId,
          senderId: userId,
        },
      });

      await this.notificationService.createNotification(
        theOther,
        'NEW_MESSAGE',
        `you got a new message from ${other?.username}`,
      );

      return {
        message: {
          id: newMsg.id,
          content: newMsg.content ? decrypt(newMsg.content) : null,
          attachmentUrl: newMsg.attachmentUrl ?? null,
          messageType: newMsg.messageType,
          conversationId: newMsg.conversationId,
          senderId: newMsg.senderId,
        },
      };
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
      const message = await this.prisma.directMessage.findFirst({
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
          content: data.message ? encrypt(data.message) : message.content,
          attachmentUrl: fileUrl,
          attachmentPublicId: fileId,
          isEdited: true,
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
        select: {
          senderId: true,
          conversationId: true,
          attachmentPublicId: true,
        },
      });

      if (!message || !message.conversationId) {
        throw new NotFoundException("couldn't find message");
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: message.conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        select: { id: true },
      });

      if (!conversation) {
        throw new NotFoundException('You are not part of this conversation');
      }

      if (userId === message.senderId) {
        // Der Absender kann die Nachricht löschen
        if (typeof message.attachmentPublicId === 'string') {
          await this.cloudinary.deleteFile(message.attachmentPublicId);
        }
        await this.prisma.directMessage.update({
          where: { id: messageId },
          data: {
            content: encrypt(ChatService.DELETE_MESSAGE),
            isEdited: false,
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
        select: { attachmentPublicId: true },
      });
      if (message?.attachmentPublicId) {
        await this.cloudinary.deleteFile(message.attachmentPublicId);
      }
      return await this.prisma.directMessage.delete({
        where: { id: messageId },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        console.warn(`Message with ID ${messageId} does not exist.`);
        return null; // Oder eine andere geeignete Aktion, z.B. eine Erfolgsmeldung zurückgeben
      }

      console.error('Failed to delete message internally:', error);
      throw error;
    }
  }
}
