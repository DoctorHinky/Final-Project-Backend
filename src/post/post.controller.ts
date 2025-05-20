import {
  Body,
  Controller,
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
  UpdateChapterDto,
  UpdateMainPostDataDto,
} from './dto';
import { getCurrentUser } from 'src/common/decorators';
import { PostService } from './post.service';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';

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
    @Body() dto: any,
    @UploadedFiles() files: Express.Multer.File[],
    @getCurrentUser('id') userId: string,
  ) {
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

  @Patch('addQuiz/:postId')
  @RequiredRoles(UserRoles.AUTHOR)
  async addQuiz(
    @getCurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateQuizDto,
  ) {
    return await this.PostService.addQuiz(userId, postId, dto);
  }

  // remove pictures from post, chapter
}
