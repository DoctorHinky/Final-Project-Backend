/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRoles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCommentsQueryDto } from './dto';
import { NotificationService } from 'src/notification/notification.service';

type selectedComment = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  user: { username: string };
};

type CommentWithUser = selectedComment & {
  user: { username: string };
};

type CommentWithReplies = CommentWithUser & {
  replies?: CommentWithReplies[];
};
@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async allCommentsOfPost(postId: string, query?: GetCommentsQueryDto) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const topLevelComments = await this.prisma.comment.findMany({
        where: { postId, parentId: null, isDeleted: false },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
          user: {
            select: { username: true },
          },
        },
        orderBy: query?.sortBy || { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // der early return is important, so we don't stress the database with unnecessary queries
      if (!topLevelComments || topLevelComments.length === 0) {
        return {
          meta: { page, limit, total: 0, totalPages: 0 },
          comments: [],
        };
      }

      const topLevelIds = topLevelComments.map((c) => c.id);

      // so we take all replies, but unordered
      const allReplyComments = await this.prisma.comment.findMany({
        where: { postId, parentId: { not: null }, isDeleted: false },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'asc' }, // Chronologisch sortieren (erste Antwort zuerst)
      });

      const relevantReplies = this.filterRelevantReplies(
        allReplyComments,
        topLevelIds,
      );

      const commentsWithAllReplies = this.buildHierarchy(
        topLevelComments,
        relevantReplies,
      );

      const total = await this.prisma.comment.count({
        where: { postId, parentId: null, isDeleted: false },
      });

      return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        comments: commentsWithAllReplies,
      };
    } catch (err) {
      throw new BadRequestException('Failed to fetch comments', {
        cause: err,
      });
    }
  }

  private filterRelevantReplies(
    allReplyComments: CommentWithUser[],
    topLevelIds: string[],
  ): CommentWithUser[] {
    const relevantReplies: CommentWithUser[] = [];
    const processedIds = new Set(topLevelIds);

    let foundNew = true;

    while (foundNew) {
      foundNew = false;

      for (const reply of allReplyComments) {
        // if we haven't processed this reply yet AND
        if (
          !processedIds.has(reply.id) &&
          reply.parentId !== null &&
          processedIds.has(reply.parentId)
        ) {
          relevantReplies.push(reply);
          processedIds.add(reply.id);
          foundNew = true; // We found a new reply to add, so repeat the loop
        }
      }
    }
    return relevantReplies;
  }

  private buildHierarchy(
    topLevelComments: CommentWithUser[],
    allReplyComments: CommentWithUser[],
  ): CommentWithReplies[] {
    // Erstellen einer Map: parentId -> Array von Antworten
    const repliesByParent = new Map<string, any[]>();

    // Gruppieren der Antworten nach parentId
    allReplyComments.forEach((reply) => {
      const parentId = reply.parentId;
      if (parentId === null) {
        return; // should not happen for replies but just in case
      }
      if (!repliesByParent.has(parentId)) {
        repliesByParent.set(parentId, []);
      }
      repliesByParent.get(parentId)?.push(reply);
    });

    // Recursive Funktion zum Anhängen von Antworten
    const attachReplies = (comment: any): any => {
      const directReplies = repliesByParent.get(comment.id) || [];

      // For each answer, add also there answers (Rekursion!)
      if (directReplies && directReplies.length > 0) {
        comment.replies = directReplies.map((reply) => attachReplies(reply));
      }

      return comment as CommentWithReplies;
    };
    return topLevelComments.map((comment) => attachReplies(comment));
  }
  /* WIE ES FUNKTIONIERT - BEISPIEL: */
  /*


Angenommen wir haben diese Kommentar-Struktur:
- Kommentar A (Top-Level)
  - Antwort B (auf A)
    - Antwort C (auf B)
    - Antwort D (auf B)
  - Antwort E (auf A)
- Kommentar F (Top-Level)
  - Antwort G (auf F)

SCHRITT 1: topLevelComments = [A, F]
SCHRITT 2: allReplies = [B, C, D, E, G] (alle Antworten im Post)
SCHRITT 3: filterRelevantReplies:
  - Runde 1: B und E haben parentId A ✓, G hat parentId F ✓ -> [B, E, G]
  - Runde 2: C und D haben parentId B ✓ -> [B, E, G, C, D]
  - Runde 3: keine neuen gefunden -> fertig
SCHRITT 4: buildHierarchy baut die verschachtelte Struktur:
  - A bekommt replies: [B, E]
    - B bekommt replies: [C, D]
    - E bekommt replies: []
  - F bekommt replies: [G]
    - G bekommt replies: []

ERGEBNIS:
[
  {
    id: 'A',
    content: '...',
    replies: [
      {
        id: 'B',
        content: '...',
        replies: [
          { id: 'C', content: '...', replies: [] },
          { id: 'D', content: '...', replies: [] }
        ]
      },
      { id: 'E', content: '...', replies: [] }
    ]
  },
  {
    id: 'F',
    content: '...',
    replies: [
      { id: 'G', content: '...', replies: [] }
    ]
  }
]
*/

  // we have to build the status filter, because we want to filter by isDeleted
  private buildStatusFilter(status?: 'all' | 'deleted' | 'notDeleted') {
    switch (status) {
      case 'deleted':
        return { isDeleted: true };
      case 'notDeleted':
        return { isDeleted: false };
      case 'all':
      default:
        return {};
    }
  }

  // filter by type of comment
  private buildTypeFilter(filter?: 'replies' | 'comments' | 'all') {
    switch (filter) {
      case 'replies':
        return { parentId: { not: null } }; // only answers
      case 'comments':
        return { parentId: null }; // top-level only
      case 'all':
      default:
        return {}; // Keine Filterung nach Typ
    }
  }
  async getCommentsByUser(userId: string, query?: GetCommentsQueryDto) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      // Build the base where condition
      const baseWhere = {
        userId,
        ...this.buildStatusFilter(query?.status),
        ...this.buildTypeFilter(query?.filter),
      };

      // Get comments with pagination
      const comments = await this.prisma.comment.findMany({
        where: baseWhere,
        include: {
          user: {
            select: {
              username: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: query?.sortBy || { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Get total count for pagination
      const total = await this.prisma.comment.count({
        where: baseWhere,
      });

      // Separate active and deleted comments (only if status is 'all')
      let activeComments = comments;
      let deletedComments: any[] = [];

      if (query?.status === 'all') {
        activeComments = comments.filter((c) => !c.isDeleted);
        deletedComments = comments.filter((c) => c.isDeleted);
      }

      return {
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          filter: query?.filter || 'all',
          status: query?.status || 'all',
        },
        activeComments,
        deletedComments,
      };
    } catch (err) {
      throw new BadRequestException('Failed to get comments by user', {
        cause: err,
      });
    }
  }

  async createComment(userId: string, postId: string, content: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) throw new NotFoundException('Post not found');

      const comment = await this.prisma.comment.create({
        data: {
          content,
          userId,
          postId,
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (post.authorId !== null && user) {
        await this.notificationService.createNotification(
          post.authorId,
          'COMMENT',
          `${user.username} hat deinen Post kommentiert`,
        );
      }

      return comment;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err; // Re-throw NotFoundException
      }
      throw new BadRequestException('Failed to create comment', { cause: err });
    }
  }

  async answerComment(commentId: string, userId: string, content: string) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) throw new NotFoundException('Comment not found');

      const answer = await this.prisma.comment.create({
        data: {
          content,
          userId,
          postId: comment.postId,
          parentId: comment.id, // Link to the original comment
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (user && user.username) {
        await this.notificationService.createNotification(
          comment.userId,
          'COMMENT',
          `${user.username} hat auf deinen Kommentar geantwortet`,
        );
      }

      return answer;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err; // Re-throw NotFoundException
      }
      throw new BadRequestException('Failed to answer comment', { cause: err });
    }
  }

  // update comments (younger than 1 hour)

  async updateComment(commentId: string, userId: string, content: string) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) throw new NotFoundException('Comment not found');

      if (comment.userId !== userId) {
        throw new BadRequestException('You can only update your own comments');
      }
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (comment.createdAt < oneHourAgo) {
        throw new BadRequestException(
          'You can only update comments within 1 hour',
        );
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: { content },
      });

      return updatedComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to update comment', {
        cause: error,
      });
    }
  }

  async deleteComment(
    user: { id: string; roles: UserRoles },
    commentId: string,
    reason?: string,
  ) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) throw new NotFoundException('Comment not found');

      const isAdmin = user.roles === UserRoles.ADMIN;
      const isOwner = comment.userId === user.id;
      const isMod = user.roles === UserRoles.MODERATOR;

      if (!isAdmin && !isOwner && !isMod) {
        throw new BadRequestException(
          'You can only delete your own comments or if you are an admin or moderator',
        );
      }

      await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedBy: user.id,
          deletedAt: new Date(),
          deleteReason: reason || 'No reason provided',
        },
      });

      return { message: 'Comment deleted successfully' };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new BadRequestException('Failed to delete comment', {
        cause: err,
      });
    }
  }

  async removeOldComments() {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const deletedComments = await this.prisma.comment.deleteMany({
        where: { deletedAt: { lte: oneMonthAgo } },
      });

      return {
        message: `${deletedComments.count} old comments removed successfully`,
      };
    } catch (error) {
      throw new BadRequestException('Failed to remove old comments', {
        cause: error,
      });
    }
  }
}
