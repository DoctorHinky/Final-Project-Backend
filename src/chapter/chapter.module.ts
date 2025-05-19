import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
