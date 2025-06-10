import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnswerFeedbackDto, SubmitFeedbackDto } from './dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async submitFeedback(userId: string, feedback: SubmitFeedbackDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.feedback.create({
        data: {
          userId: user.id,
          content: feedback.content,
          rating: feedback.rating,
          allowedToPublish: feedback.allowedToPublish,
        },
      });

      return { message: 'Feedback submitted successfully' };
    } catch (error) {
      console.error('problem while submitting feedback: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException('submitting feedback failed', {
        cause: error,
      });
    }
  }

  async getAllFeedbacks(
    page: number = 1,
    limit: number = 10,
    orderedBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    try {
      const allowedOrder = ['createdAt', 'rating'];
      if (!allowedOrder.includes(orderedBy)) {
        throw new BadRequestException(
          `Invalid order by field: ${orderedBy}. Allowed fields are: ${allowedOrder.join(', ')}`,
        );
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException('Page and limit must be greater than 0');
      }

      if (limit > 100) {
        throw new BadRequestException('Limit cannot exceed 100');
      }

      const feedbacks = await this.prisma.feedback.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderedBy]: order },
      });

      const totalCount = await this.prisma.feedback.count();

      return {
        feedbacks,
        totalCount,
        page,
        limit,
      };
    } catch (error) {
      console.error('problem while fetching feedbacks: ', error);
      throw new BadRequestException('fetching feedbacks failed', {
        cause: error,
      });
    }
  }

  async getPublicFeedbacks(
    page: number = 1,
    limit: number = 10,
    orderedBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    try {
      const allowedOrder = ['createdAt', 'rating'];
      if (!allowedOrder.includes(orderedBy)) {
        throw new BadRequestException(
          `Invalid order by field: ${orderedBy}. Allowed fields are: ${allowedOrder.join(', ')}`,
        );
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException('Page and limit must be greater than 0');
      }
      if (limit > 100) {
        throw new BadRequestException('Limit cannot exceed 100');
      }

      const feedbacks = await this.prisma.feedback.findMany({
        where: { allowedToPublish: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderedBy]: order },
      });

      const totalCount = await this.prisma.feedback.count({
        where: { allowedToPublish: true },
      });

      return {
        feedbacks,
        totalCount,
        page,
        limit,
      };
    } catch (error) {
      console.error('problem while fetching public feedbacks: ', error);
      throw new BadRequestException('fetching public feedbacks failed', {
        cause: error,
      });
    }
  }

  async answerFeedback(
    feedbackId: string,
    answer: AnswerFeedbackDto,
    userId: string,
  ) {
    try {
      const feedback = await this.prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: { user: true },
      });

      if (!feedback) throw new NotFoundException('Feedback not found');

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.feedbackResponse.create({
        data: {
          feedbackId: feedback.id,
          content: answer.content,
          adminId: user.id,
          sentViaEmail: true,
        },
      });

      await this.prisma.feedback.update({
        where: { id: feedback.id },
        data: { readed: true },
      });

      if (feedback.user?.email) {
        await this.mail.sendFeedbackAnswer(feedback.user?.email, {
          firstname: user.username,
          username: feedback.user?.username,
          content: answer.content,
        });
      }

      return 'answer successfully providet';
    } catch (error) {
      console.error('problem while answering feedback: ', error);
      throw new BadRequestException('answering feedback failed', {
        cause: error,
      });
    }
  }

  async getFeedbackById(feedbackId: string) {
    try {
      const feedback = await this.prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          user: { select: { id: true, username: true, email: true } },
          responses: {
            include: { admin: { select: { id: true, username: true } } },
          },
        },
      });

      if (!feedback) throw new NotFoundException('Feedback not found');

      return feedback;
    } catch (error) {
      console.error('problem while fetching feedback by ID: ', error);
      throw new BadRequestException('fetching feedback by ID failed', {
        cause: error,
      });
    }
  }

  async deleteFeedback(feedbackId: string) {
    try {
      const feedback = await this.prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) throw new NotFoundException('Feedback not found');

      await this.prisma.feedback.delete({ where: { id: feedbackId } });

      return 'Feedback deleted successfully';
    } catch (error) {
      console.error('problem while deleting feedback: ', error);
      throw new BadRequestException('deleting feedback failed', {
        cause: error,
      });
    }
  }
}
