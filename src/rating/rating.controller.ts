import { Controller, Param, Post } from '@nestjs/common';
import { getCurrentUser } from 'src/common/decorators';
import { RatingService } from './rating.service';

@Controller('rating')
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Post('like/:postId')
  async likePost(
    @getCurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return await this.ratingService.setRating(userId, postId, 1);
  }

  @Post('dislike/:postId')
  async dislikePost(
    @getCurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return await this.ratingService.setRating(userId, postId, -1);
  }
}
