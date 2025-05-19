import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
