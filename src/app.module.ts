import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { Authmodule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtGuard } from './common/guards';
import { SeedModule } from 'Admins/Seeder.module';
import { RolesGuard } from './common/guards/roles.guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TicketModule } from './ticket/ticket.module';
import { PostModule } from './post/post.module';
import { ChapterModule } from './chapter/chapter.module';
import { QuizModule } from './quiz/quiz.module';
import { RatingModule } from './rating/rating.module';
import { CommentModule } from './comment/comment.module';
import { CommentRatingModule } from './comment-rating/comment-rating.module';
import { FriendModule } from './friend/friend.module';
import { ApplicationModule } from './application/application.module';
import { MailModule } from './mail/mail.module';
import { HistoryModule } from './history/history.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    Authmodule,
    UserModule,
    PrismaModule,
    SeedModule,
    CloudinaryModule,
    TicketModule,
    PostModule,
    ChapterModule,
    QuizModule,
    RatingModule,
    CommentModule,
    CommentRatingModule,
    FriendModule,
    ApplicationModule,
    MailModule,
    HistoryModule,
    FeedbackModule,
    NotificationModule,
    ChatModule,
    ConversationModule,
  ],
  providers: [
    { provide: 'APP_GUARD', useClass: AtGuard },
    { provide: 'APP_GUARD', useClass: RolesGuard },
  ],
})
export class AppModule {}
