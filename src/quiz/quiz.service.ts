import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BasePrismaService } from 'src/common/utilitys/base-prisma.service';
import { CreateQuizDto, QuizAnswerDto, QuizQuestionDto } from 'src/post/dto';
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
      data: { postId: postId },
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

  async addQuestion(
    quizId: string,
    data: QuizQuestionDto,
    tx: PrismaService | Prisma.TransactionClient,
  ) {
    const quiz = await tx.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) throw new NotFoundException('Quiz not found in QuizService');
    const question = await tx.quizQuestion.create({
      data: {
        question: data.question,
        explanation: data.explanation ?? null,
        quizId: quiz.id,
      },
    });

    await tx.quizAnswer.createMany({
      data: data.answers.map((answer: QuizAnswerDto) => ({
        answer: answer.answer,
        isCorrect: answer.isCorrect,
        questionId: question.id,
      })),
    });
    return question;
  }
  async removeQuestion(
    questionId: string,
    tx: PrismaService | Prisma.TransactionClient,
  ) {
    await tx.quizQuestion.delete({ where: { id: questionId } });
    return 'Question deleted';
  }

  async addAnswer(
    questionId: string,
    data: QuizAnswerDto,
    tx: PrismaService | Prisma.TransactionClient,
  ) {
    const question = await tx.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new NotFoundException('Question not found');
    const answer = await tx.quizAnswer.create({
      data: {
        answer: data.answer,
        isCorrect: data.isCorrect,
        questionId: question.id,
      },
    });
    return answer;
  }

  async removeAnswer(
    quesitonId: string,
    answerId: string,
    tx: PrismaService | Prisma.TransactionClient,
  ) {
    const question = await tx.quizQuestion.findUnique({
      where: { id: quesitonId },
      include: {
        answers: true,
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    const answer = question.answers.find((answer) => answer.id === answerId);
    if (!answer) throw new NotFoundException('Answer not found');

    await tx.quizAnswer.delete({
      where: { id: answerId },
    });
    return 'answer succesfully deleted';
  }
}
