import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { getCurrentUser } from 'src/common/decorators';
import { CommentService } from './comment.service';
import { GetCommentsQueryDto } from './dto';
import { UserRoles } from '@prisma/client';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post('commentOnPost/:postId')
  commentOnPost(
    @Param('postId') postId: string,
    @getCurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.createComment(userId, postId, content);
  }

  @Post('answerComment/:commentId')
  answerComment(
    @Param('commentId') commentId: string,
    @getCurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.answerComment(commentId, userId, content);
  }

  @Get('getAllComments/:postId')
  getAllComments(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryDto,
  ) {
    return this.commentService.allCommentsOfPost(postId, query);
  }

  @Get('getCommentsByUser/:userId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getCommentsByUser(
    @Param('userId') userId: string,
    @Query() query: GetCommentsQueryDto,
  ) {
    return this.commentService.getCommentsByUser(userId, query);
  }

  @Patch('editComment/:commentId')
  editComment(
    @Param('commentId') commentId: string,
    @getCurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(commentId, userId, content);
  }

  @Patch('deleteComment/:commentId')
  deleteComment(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.deleteComment(user, commentId);
  }
}
