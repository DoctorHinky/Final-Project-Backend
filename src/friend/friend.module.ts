import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [FriendController],
  providers: [FriendService],
  imports: [PrismaModule, NotificationModule],
})
export class FriendModule {}
