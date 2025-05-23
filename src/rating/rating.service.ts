import { Injectable } from '@nestjs/common';
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
      const exitingLike = await tx.rating.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });

      if (exitingLike) {
        // wenn die gleiche Bewertung erneut gegeben wird, dann löschen (toggle)
        if (exitingLike.value === value) {
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
        const diff = value - exitingLike.value;
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

  async getTopRatedPosts(limit: number) {
    const results = await this.prisma.rating.groupBy({
      by: ['postId'],
      _sum: { value: true },
      orderBy: { _sum: { value: 'desc' } },
      take: limit,
    });

    return results.map((r) => ({
      postId: r.postId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      rating: r._sum.value,
    }));
  }
}
