import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRoles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentRatingService {
  constructor(private prisma: PrismaService) {}

  async setRating(userId: string, commentId: string, value: number) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { userId: true },
      });

      if (!comment) throw new Error('Comment not found');
      if (comment.userId === userId) {
        throw new Error('You cannot rate your own comment');
      }

      const existingRating = await tx.commentRating.findUnique({
        where: {
          commentId_userId: { commentId, userId },
        },
      });

      let message = '';
      let thanksDelta = 0;

      if (existingRating) {
        // Toggle bei gleiche Bewertung erneut
        if (existingRating.value === value) {
          await tx.commentRating.delete({
            where: { commentId_userId: { commentId, userId } },
          });

          if (value === 1) thanksDelta = -1;
          message = 'rating removed';
        } else {
          await tx.commentRating.update({
            where: { commentId_userId: { commentId, userId } },
            data: { value },
          });

          // alte Bewertung war Danke => -1
          if (existingRating.value === 1 && value !== 1) {
            thanksDelta = -1;
          } else if (existingRating.value !== 1 && value === 1) {
            thanksDelta = +1;
          }

          message = 'rating updated';
        }
      } else {
        await tx.commentRating.create({
          data: {
            value,
            userId,
            commentId,
          },
        });

        if (value === 1) thanksDelta = +1;
        message = 'rating created';
      }

      if (thanksDelta !== 0) {
        await tx.comment.update({
          where: { id: commentId },
          data: {
            thanksCount: {
              increment: thanksDelta,
            },
          },
        });
      }

      const updated = await tx.comment.findUnique({
        where: { id: commentId },
        select: { thanksCount: true },
      });

      return {
        message,
        thanksCount: updated?.thanksCount ?? 0,
      };
    });
  }

  async getRating(user: { id: string; roles: UserRoles }, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (
      user.roles !== UserRoles.ADMIN &&
      user.roles !== UserRoles.MODERATOR &&
      comment.userId === user.id
    ) {
      throw new BadRequestException(
        'Only the comment owner or a moderator/admin can view the ratings',
      );
    }

    const [likes = 0, dislikes = 0] = await Promise.all([
      this.prisma.commentRating.count({
        where: { commentId, value: 1 },
      }),
      this.prisma.commentRating.count({
        where: { commentId, value: -1 },
      }),
    ]);

    return {
      commentId,
      likes,
      dislikes,
      totalReactions: likes + dislikes,
    };
  }
}
