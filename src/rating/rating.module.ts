import { forwardRef, Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostModule } from 'src/post/post.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PostModule), UserModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
