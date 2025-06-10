import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { getCurrentUser } from 'src/common/decorators';
import { AnswerFeedbackDto, SubmitFeedbackDto } from './dto';
import { FeedbackService } from './feedback.service';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('submit')
  submitFeedBack(
    @getCurrentUser('id') userId: string,
    @Body() feedback: SubmitFeedbackDto,
  ) {
    return this.feedbackService.submitFeedback(userId, feedback);
  }

  @Post('answer/:feedbackId')
  @RequiredRoles(UserRoles.MODERATOR, UserRoles.ADMIN)
  answerFeedback(
    @getCurrentUser('id') userId: string,
    @Body() answer: AnswerFeedbackDto,
    @Param('feedbackId') feedbackId: string,
  ) {
    return this.feedbackService.answerFeedback(feedbackId, answer, userId);
  }

  @Get('all')
  @RequiredRoles(UserRoles.MODERATOR, UserRoles.ADMIN)
  getAllFeedbacks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderedBy') orderedBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.feedbackService.getAllFeedbacks(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      orderedBy,
      order,
    );
  }

  @Get('public')
  getPublicFeedbacks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderedBy') orderedBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.feedbackService.getPublicFeedbacks(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      orderedBy,
      order,
    );
  }

  @Get(':feedbackId')
  @RequiredRoles(UserRoles.MODERATOR, UserRoles.ADMIN)
  getFeedbackById(@Param('feedbackId') feedbackId: string) {
    return this.feedbackService.getFeedbackById(feedbackId);
  }

  @Delete(':feedbackId')
  @RequiredRoles(UserRoles.ADMIN)
  deleteFeedback(@Param('feedbackId') feedbackId: string) {
    return this.feedbackService.deleteFeedback(feedbackId);
  }
}
