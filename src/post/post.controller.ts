import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PostUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import {
  ChapterDto,
  CreateQuizDto,
  PagePostDto,
  QuizAnswerDto,
  QuizQuestionDto,
  UpdateChapterDto,
  UpdateMainPostDataDto,
} from './dto';
import { getCurrentUser } from 'src/common/decorators';
import { PostService } from './post.service';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';
import { DeleteReasonDto } from './dto/delete-reason.dto';

@Controller('article')
export class PostController {
  constructor(private PostService: PostService) {}

  @Get('getPreviews')
  async getPostPreviews(
    @getCurrentUser('id') userId: string,
    @Query() query: PagePostDto,
  ) {
    return this.PostService.getPostPreviews(userId, query);
  }

  @Get('getPostForUser')
  async getPostForUser(@getCurrentUser('id') userId: string) {
    return this.PostService.getPostForUser(userId);
  }

  @Get('getPostById/:postId')
  async getPostById(
    @getCurrentUser('id') userId: string,
    @getCurrentUser('roles') role: UserRoles,
    @Param('postId') postId: string,
  ) {
    return this.PostService.getPostById(userId, role, postId);
  }

  @Get('getPostByAuthor/:authorId')
  async getPostByAuthor(
    @getCurrentUser('roles') role: UserRoles,
    @Param('authorId') authorId: string,
  ) {
    return await this.PostService.getPostByAuthor(role, authorId);
  }
  // hier ist ein fettes problem, wenn keine bilder gegeben sind bricht das system
  @Post('create')
  @RequiredRoles(UserRoles.AUTHOR)
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 15 * 1024 * 1024, files: 10 }, // 15MB
      storage: memoryStorage(),
    }),
    PostUploadInterceptor,
  )
  async createPost(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
    @getCurrentUser('id') userId: string,
  ) {
    console.log('======= Controller =======');
    console.log('Files:', files);
    console.log('DTO:', dto);
    console.log('User ID:', userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.PostService.createPost(userId, dto, files);
  }
  // die hier kann nur die direkten post felder ändern
  @Patch('update/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async updatePost(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateMainPostDataDto,
  ) {
    return await this.PostService.updatePost(user, postId, dto, file);
  }

  @Patch('addPostImage/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async addPostImage(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.PostService.addPostImage(user, postId, file);
  }

  @Patch('removePostImage/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  async removePostImage(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
  ) {
    return await this.PostService.removePostImage(user, postId);
  }

  @Patch('publishPost/:postId')
  @RequiredRoles(UserRoles.AUTHOR)
  async publishPost(
    @getCurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return await this.PostService.publishPost(userId, postId);
  }

  @Patch('unpublishPost/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  async unpublishPost(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
  ) {
    return await this.PostService.unpublishPost(user, postId);
  }
  @Patch('addChapter/:postId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async addChapter(
    @getCurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ChapterDto,
    @Param('postId') postId: string,
  ) {
    return await this.PostService.addChapter(postId, userId, dto, file);
  }

  @Patch('updateChapter/:postId/:chapterId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async updateChapter(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateChapterDto,
    @Param('postId') postId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return await this.PostService.updateChapter(
      postId,
      user,
      dto,
      chapterId,
      file,
    );
  }

  @Patch('addChapterImage/:postId/:chapterId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async addChapterImage(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @UploadedFile() file: Express.Multer.File,
    @Param('postId') postId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return await this.PostService.addChapterImage(
      user,
      file,
      postId,
      chapterId,
    );
  }

  @Patch('removeChapterImage/:postId/:chapterId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  async removeChapterImage(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return await this.PostService.removeChapterImage(user, postId, chapterId);
  }

  @Patch('addQuiz/:postId')
  @RequiredRoles(UserRoles.AUTHOR)
  async addQuiz(
    @getCurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return await this.PostService.addQuiz(userId, postId, dto);
  }

  // patching quiz will not supported, only adding and delete components in it.

  @Patch('updateQuiz/addQuestion/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  addQuestion(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Body() dto: QuizQuestionDto,
  ) {
    return this.PostService.addQuestion(user, postId, dto);
  }

  @Delete('updateQuiz/removeQuestion/:postId/:quizId/:questionId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  removeQuestion(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.PostService.removeQuestion(user, postId, quizId, questionId);
  }

  @Patch('updateQuestion/addAnswer/:postId/:quizId/:questionId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  addAnswer(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: QuizAnswerDto,
  ) {
    return this.PostService.addAnswer(user, postId, quizId, questionId, dto);
  }

  @Delete('updateQuestion/removeAnswer/:postId/:quizId/:questionId/:answerId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  removeAnswer(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
  ) {
    return this.PostService.removeAnswer(
      user,
      postId,
      quizId,
      questionId,
      answerId,
    );
  }

  // DELETE LOGIC FOR POSTS

  @Patch('deletePost/:postId')
  @RequiredRoles(UserRoles.AUTHOR, UserRoles.ADMIN, UserRoles.MODERATOR)
  async deletePost(
    @getCurrentUser() user: { id: string; roles: UserRoles },
    @Param('postId') postId: string,
    @Body() dto: DeleteReasonDto,
  ) {
    return await this.PostService.deletePost(user, postId, dto);
  }

  @Patch('restorePost/:postId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async restorePost(@Param('postId') postId: string) {
    return await this.PostService.restorePost(postId);
  }

  @Delete('removePost/:postId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async removePost(
    @getCurrentUser('roles') role: UserRoles,
    @Param('postId') postId: string,
  ) {
    return await this.PostService.removePost(postId, role);
  }

  // remove pictures from post, chapter
}
