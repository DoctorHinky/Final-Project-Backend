import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  providers: [FeedbackService],
  controllers: [FeedbackController],
  imports: [PrismaModule, MailModule],
})
export class FeedbackModule {}
