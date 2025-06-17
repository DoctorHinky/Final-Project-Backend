import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from 'src/chat/chat.service';
import { decrypt } from 'src/common/utilitys/encryptoin';
import { limitConcurrency } from 'src/common/utilitys/promise-limiter';
import { FriendService } from 'src/friend/friend.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private Friends: FriendService,
    private MsgService: ChatService,
  ) {}

  async createConversation(userId: string, targetId: string) {
    try {
      const [user, target] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }),
        this.prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true },
        }),
      ]);

      if (!user || !target) {
        throw new NotFoundException('One or both users not found');
      }

      const isFriend = await this.Friends.isFriendWith(user.id, target.id);

      if (isFriend === false) {
        throw new BadRequestException(
          'You can only start a conversation with friends',
        );
      }

      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: user.id, user2Id: target.id },
            { user1Id: target.id, user2Id: user.id },
          ],
        },
        select: { id: true, user1Id: true, user2Id: true },
      });

      if (existingConversation) {
        return await this.getConversation(existingConversation.id, user.id);
      } else {
        const conversation = await this.prisma.conversation.create({
          data: {
            user1Id: user.id,
            user2Id: target.id,
          },
        });

        return conversation;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      if (error instanceof NotFoundException) {
        throw error; // Weiterwerfen für den Controller
      } else {
        throw new BadRequestException(
          'Failed to create conversation. Please try again later.',
          { cause: error },
        );
      }
    }
  }

  async getConversation(conversationId: string, userId: string) {
    try {
      console.log(
        'Fetching conversation with ID:',
        conversationId,
        'for user:',
        userId,
      );
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
          messages: {
            where: {
              OR: [
                { senderId: userId, isDeletedForSender: false },
                {
                  senderId: { not: userId },
                  isDeletedForReceiver: false,
                },
              ],
            },
            orderBy: { createdAt: 'desc' }, // neue Nachrichten zuletzt
            take: 50, // die letzten 50 Nachrichten
            select: {
              id: true,
              conversationId: true,
              senderId: true,
              content: true,
              messageType: true,
              attachmentUrl: true,
              isRead: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
            select: { messages: true }, // take 50 begrenzt den Count nicht
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException(
          'Unable to load conversation, please start a new one',
        );
      }

      conversation.messages = conversation.messages.map((msg) => ({
        ...msg,
        content:
          msg.content && msg.content !== ChatService.DELETE_MESSAGE
            ? decrypt(msg.content)
            : msg.content,
      }));

      await this.prisma.directMessage.updateMany({
        where: { conversationId, isRead: false, senderId: { not: userId } },
        data: { isRead: true },
      });

      // delete all over 50 messages
      if (conversation._count.messages > 50) {
        const messagesToDelete = await this.prisma.directMessage.findMany({
          where: {
            conversationId,
            isRead: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: 50,
          take: 500, // max 500 Nachrichten löschen
          select: { id: true },
        });

        if (messagesToDelete.length > 0) {
          const deletePromises = messagesToDelete.map((message) => {
            return () => this.MsgService.deleteMessageInternal(message.id);
          });
          await limitConcurrency(5, deletePromises);
        }
      }
      console.log('Conversation loaded successfully:', conversation);
      return conversation;
    } catch (error) {
      console.error('Failed to get conversation: ', error);
      if (error instanceof NotFoundException) {
        throw error; // Weiterwerfen für den Controller
      }
      throw new BadRequestException(
        'Failed to retrieve conversation. Please try again later.',
        { cause: error },
      );
    }
  }

  async getAllConversations(userId: string) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
          user1: { select: { id: true, username: true, profilePicture: true } },
          user2: { select: { id: true, username: true, profilePicture: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Nur die letzte Nachricht
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (conversations.length === 0) {
        return [];
      }
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount = await this.prisma.directMessage.count({
            where: {
              conversationId: conversation.id,
              isRead: false,
              senderId: { not: userId },
            },
          });

          const otherUser =
            conversation.user1.id === userId
              ? conversation.user2
              : conversation.user1;

          return {
            id: conversation.id,
            otherUserId: otherUser.id,
            otherUsername: otherUser.username,
            otherProfilePicture: otherUser.profilePicture,
            lastMessage: conversation.messages[0]
              ? {
                  id: conversation.messages[0].id,
                  content: conversation.messages[0].content
                    ? decrypt(conversation.messages[0].content)
                    : null,
                  createdAt: conversation.messages[0].createdAt,
                }
              : null,
            updatedAt: conversation.updatedAt,
            unreadCount,
          };
        }),
      );

      return enrichedConversations;
    } catch (error) {
      console.error('Failed to get all conversations:', error);
      throw new BadRequestException(
        'Failed to retrieve conversations. Please try again later.',
        { cause: error },
      );
    }
  }

  async deleteConversation(conversationId: string, userId: string) {
    try {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
          messages: true,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const deletePromises = conversation.messages.map((message) => {
        return () => this.MsgService.deleteMessage(userId, message.id);
      });

      await limitConcurrency(5, deletePromises);

      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });

      return { message: 'Conversation deleted successfully' };
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      if (error instanceof NotFoundException) {
        throw error; // Weiterwerfen für den Controller
      }
      throw new BadRequestException(
        'Failed to delete conversation. Please try again later.',
        { cause: error },
      );
    }
  }
}
