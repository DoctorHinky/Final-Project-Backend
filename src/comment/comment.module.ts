import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [NotificationModule],
})
export class CommentModule {}
