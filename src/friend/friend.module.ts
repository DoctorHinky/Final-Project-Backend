import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FriendController],
  providers: [FriendService],
  imports: [PrismaModule],
})
export class FriendModule {}
