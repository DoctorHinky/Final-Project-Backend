import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BasePrismaService } from 'src/common/utilitys/base-prisma.service';
import { CreateQuizDto } from 'src/post/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuizService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createQuiz(
    postId: string,
    data: CreateQuizDto,
    tx?: PrismaService | Prisma.TransactionClient,
  ) {
    const prisma = this.getPrisma(tx);

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        postId: postId,
      },
    });

    for (const questionDto of data.questions) {
      const question = await prisma.quizQuestion.create({
        data: {
          question: questionDto.question,
          explanation: questionDto.explanation,
          quizId: quiz.id,
        },
      });

      await prisma.quizAnswer.createMany({
        data: questionDto.answers.map((answer) => ({
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          questionId: question.id,
        })),
      });
    }
  }
}
