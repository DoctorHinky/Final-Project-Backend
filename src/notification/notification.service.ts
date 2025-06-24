import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { limitConcurrency } from 'src/common/utilitys/promise-limiter';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  private getTypeValue(type: string): NotificationType {
    const typeValue = NotificationType[type as keyof typeof NotificationType];
    if (!typeValue) {
      throw new BadRequestException(`Invalid notification type: ${type}`);
    }
    return typeValue;
  }

  async createNotification(userId: string, type: string, content: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: this.getTypeValue(type),
          content,
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error; // Wieder werfen für Debug oder Exception Handling im Controller
    }
  }

  async getNotificationCount(userId: string): Promise<number> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const count = await this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });

      return count;
    } catch (error) {
      console.error('Failed to get notification count:', error);
      throw new BadRequestException(
        'Failed to retrieve notification count. Please try again later.',
      );
    }
  }

  async getNotifications(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const notifications = await this.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (notifications.length === 0) {
        return [];
      } else {
        return notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          content: notification.content,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
        }));
      }
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw new BadRequestException(
        'Failed to retrieve notifications. Please try again later.',
      );
    }
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId, userId: user.id },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new BadRequestException(
        'Failed to mark notification as read. Please try again later.',
      );
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new BadRequestException(
        'Failed to mark all notifications as read. Please try again later.',
      );
    }
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId, userId: user.id },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      await this.prisma.notification.delete({
        where: { id: notification.id },
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw new BadRequestException(
        'Failed to delete notification. Please try again later.',
      );
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      await this.prisma.notification.deleteMany({
        where: { userId: user.id },
      });
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw new BadRequestException(
        'Failed to delete all notifications. Please try again later.',
      );
    }
  }

  @Cron('0 */6 * * *') // alle 6 Stunden
  async deleteReadNotifications(): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const notificationsToDelete = await this.prisma.notification.findMany({
        where: {
          isRead: true,
          updatedAt: { lt: twentyFourHoursAgo },
        },
        select: { id: true },
      });

      if (notificationsToDelete.length === 0) return;

      const deleteTasks = notificationsToDelete.map((notif) => async () => {
        await this.prisma.notification.delete({ where: { id: notif.id } });
      });

      await limitConcurrency(5, deleteTasks);
    } catch (error) {
      console.error('❌ Failed to delete read notifications:', error);
    }
  }
}
