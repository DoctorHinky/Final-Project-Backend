import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { QuizModule } from 'src/quiz/quiz.module';
import { ChapterModule } from 'src/chapter/chapter.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [PostService],
  controllers: [PostController],
  imports: [QuizModule, ChapterModule, CloudinaryModule],
})
export class PostModule {}
