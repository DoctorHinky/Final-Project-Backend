import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  providers: [
    { provide: 'APP_GUARD', useClass: AtGuard },
    { provide: 'APP_GUARD', useClass: RolesGuard },
  ],
})
export class AppModule {}
