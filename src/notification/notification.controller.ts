import { Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { getCurrentUser } from 'src/common/decorators';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  // keine CreateNotification Methode im Controller, da sie nur intern verwendet wird

  @Get('count')
  getNotificationCount(@getCurrentUser('id') userId: string) {
    return this.notificationService.getNotificationCount(userId);
  }

  @Get()
  getNotifications(@getCurrentUser('id') userId: string) {
    return this.notificationService.getNotifications(userId);
  }

  @Patch('read/:id')
  markNotificationAsRead(
    @getCurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(
      userId,
      notificationId,
    );
  }

  @Patch('read-all')
  markAllNotificationsAsRead(@getCurrentUser('id') userId: string) {
    return this.notificationService.markAllNotificationsAsRead(userId);
  }
  @Delete('all')
  deleteAllNotifications(@getCurrentUser('id') userId: string) {
    return this.notificationService.deleteAllNotifications(userId);
  }

  // die reihenfolge der endpoints ist wichtig, damit die spezifischen Endpunkte vor den allgemeinen Endpunkten geprüft werden

  @Delete(':id')
  deleteNotification(
    @getCurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(userId, notificationId);
  }
}
