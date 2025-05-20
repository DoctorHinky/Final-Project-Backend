import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
