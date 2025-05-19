import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PostUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import { CreatePost, PagePostDto } from './dto';
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

  @Post('create')
  @RequiredRoles(UserRoles.AUTHOR)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024, files: 15 },
    }),
    PostUploadInterceptor,
  )
  async createPost(
    @Body() dto: CreatePost,
    @getCurrentUser('id') userId: string,
  ) {
    return this.PostService.createPost(userId, dto);
  }
}
