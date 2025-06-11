import { BadRequestException, Injectable } from '@nestjs/common';
import { limitConcurrency } from 'src/common/utilitys/promise-limiter';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async getHistory(
    userId: string,
    pagination: { page: number; limit: number },
  ) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const history = await this.prisma.history.findMany({
        where: { userId },
        select: {
          id: true,
          postId: true,
          readAt: true,
          solvedAt: true,
          post: {
            select: {
              id: true,
              title: true,
              quickDescription: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      });
      const total = await this.prisma.history.count({ where: { userId } });

      return {
        message: 'History fetched successfully',
        meta: {
          page: page,
          limit: limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        },
        data: history.map((item) => {
          return {
            id: item.id,
            postId: item.postId,
            readAt: item.readAt,
            solvedAt: item.solvedAt ?? null,
            postTitle: item.post.title,
            postQuickDescription: item.post.quickDescription,
            postAuthor: item.post.author?.username,
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      throw new BadRequestException('Failed to fetch history');
    }
  }

  async markAsRead(userId: string, postId: string) {
    try {
      const existingHistory = await this.prisma.history.findFirst({
        where: { userId, postId },
      });

      if (existingHistory) {
        return {
          message: 'Post already marked as read',
          data: existingHistory,
        };
      }

      const newHistory = await this.prisma.history.create({
        data: {
          userId,
          postId,
          readAt: new Date(),
        },
      });

      return {
        message: 'Post marked as read successfully',
        data: newHistory,
      };
    } catch (err) {
      console.error('Error marking post as read:', err);
      throw new BadRequestException('Failed to mark post as read');
    }
  }

  async internalMarkAsRead(userId: string, postId: string) {
    const history = await this.prisma.history.findFirst({
      where: { userId, postId },
    });
    return (
      history ??
      (await this.prisma.history.create({
        data: { userId, postId, readAt: new Date() },
      }))
    );
  }

  async markAsSolved(userId: string, postId: string, score: number) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          quiz: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!post || !post.quiz) {
        throw new BadRequestException(
          'Post not found, or does not have a quiz',
        );
      }
      let history = await this.prisma.history.findFirst({
        where: { userId, postId },
      });
      if (!history) {
        history = await this.prisma.history.create({
          data: {
            userId,
            postId,
            quizId: post.quiz.id,
            readAt: new Date(),
            solvedAt: new Date(),
            quizScore: score,
            attempts: 1,
            solvedQuiz: true,
          },
        });

        return {
          message: 'Post marked as solved successfully',
          data: history,
        };
      }

      const updatedAttempts = (history.attempts ?? 0) + 1;
      const updatedScore =
        history.quizScore === null || history.quizScore < score
          ? score
          : history.quizScore;

      history = await this.prisma.history.update({
        where: { id: history.id },
        data: {
          solvedAt: new Date(),
          quizScore: updatedScore,
          attempts: updatedAttempts,
          solvedQuiz: true,
        },
      });

      return {
        message: 'Post marked as solved successfully',
        data: history,
      };
    } catch (err) {
      console.error('Error marking post as solved:', err);
      throw new BadRequestException('Failed to mark post as solved');
    }
  }

  async removeHistory(historyId: string) {
    try {
      const history = await this.prisma.history.findFirst({
        where: { id: historyId },
      });

      if (!history) {
        throw new BadRequestException('Post not found in history');
      }

      await this.prisma.history.delete({
        where: { id: history.id },
      });

      return {
        message: 'Post removed from history successfully',
      };
    } catch (err) {
      console.error('Error removing post from history:', err);
      throw new BadRequestException('Failed to remove post from history');
    }
  }

  async clearHistory(userId: string) {
    try {
      const entries = await this.prisma.history.findMany({
        where: { userId },
        select: { id: true },
      });

      if (entries.length === 0) {
        return { message: 'No history to clear' };
      }

      const tasks = entries.map(
        (entry) => () =>
          this.prisma.history.delete({ where: { id: entry.id } }),
      );

      await limitConcurrency(10, tasks);

      return {
        message: `History cleared successfully (${entries.length} entries)`,
      };
    } catch (err) {
      console.error('Error clearing history:', err);
      throw new BadRequestException('Failed to clear history');
    }
  }
}
