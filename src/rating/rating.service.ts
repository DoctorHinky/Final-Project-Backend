import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RatingService {
  constructor(
    private prisma: PrismaService,
    private PostService: PostService,
  ) {}

  setRating(userId: string, postId: string, value: number) {
    return this.prisma.$transaction(async (tx) => {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) throw new NotFoundException('Post not found');
      if (post.authorId === userId) {
        throw new ForbiddenException('You cannot rate your own post');
      }

      const exitingRating = await tx.rating.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });

      if (exitingRating) {
        // wenn die gleiche Bewertung erneut gegeben wird, dann löschen (toggle)
        if (exitingRating.value === value) {
          await tx.post.update({
            where: { id: postId },
            data: { popularityScore: { decrement: 1 } },
          });
          return tx.rating.delete({
            where: {
              postId_userId: { postId, userId },
            },
          });
        }

        // Bewertung ändern (-1 + -1 = 0, 1 - -1 = 2, 1 - 1 = 0, 1 - 0 = 1, -1 - 0 = -1, 0 - 1 = -1)
        const diff = value - exitingRating.value;
        await tx.post.update({
          where: { id: postId },
          data: { popularityScore: { increment: diff } },
        });

        // wenn eine andere Bewertung gegeben wird, dann aktualisieren
        return tx.rating.update({
          where: { postId_userId: { postId, userId } },
          data: { value },
        });
      }

      // new rating
      await tx.post.update({
        where: { id: postId },
        data: { popularityScore: { increment: 1 } },
      });

      return tx.rating.create({
        data: { postId, userId, value },
      });
    });
  }

  async getRating(postId: string) {
    const [likes = 0, dislikes = 0] = await Promise.all([
      this.prisma.rating.count({
        where: { postId, value: 1 },
      }),
      this.prisma.rating.count({
        where: { postId, value: -1 },
      }),
    ]);

    return { postId, likes, dislikes };
  }

  async getTopRatedPosts(limit: number = 10, page: number = 1) {
    if (limit < 1 || page < 1) {
      throw new ForbiddenException('Limit and page must be greater than 0');
    }
    if (limit > 100) {
      throw new ForbiddenException('Limit cannot exceed 100');
    }
    const skip = (page - 1) * limit;

    const results = await this.prisma.rating.groupBy({
      by: ['postId'],
      _sum: { value: true },
      orderBy: { _sum: { value: 'desc' } },
      take: limit,
      skip: skip,
      where: {
        post: {
          published: true,
          isDeleted: false,
        },
      },
    });

    return results.map((r) => ({
      postId: r.postId,
      rating: r._sum.value,
    }));
  }
}
