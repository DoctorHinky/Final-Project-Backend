import { Controller, Get, Param, Post } from '@nestjs/common';
import { CommentRatingService } from './comment-rating.service';
import { getCurrentUser } from 'src/common/decorators';
import { UserRoles } from '@prisma/client';

@Controller('comment-rating')
export class CommentRatingController {
  constructor(private commentRatingService: CommentRatingService) {}

  @Post('like/:commentId')
  async likeComment(
    @getCurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return await this.commentRatingService.setRating(userId, commentId, 1);
  }

  @Post('dislike/:commentId')
  async dislikeComment(
    @getCurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return await this.commentRatingService.setRating(userId, commentId, -1);
  }

  @Get('rating/:commentId')
  async getCommentRating(
    @Param('commentId') commentId: string,
    @getCurrentUser() user: { id: string; roles: UserRoles },
  ) {
    return await this.commentRatingService.getRating(user, commentId);
  }
}
