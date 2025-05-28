import { Module } from '@nestjs/common';
import { CommentRatingController } from './comment-rating.controller';
import { CommentRatingService } from './comment-rating.service';

@Module({
  controllers: [CommentRatingController],
  providers: [CommentRatingService],
})
export class CommentRatingModule {}
