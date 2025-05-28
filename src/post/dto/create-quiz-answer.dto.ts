import { IsBoolean, IsString, Length } from 'class-validator';

export class QuizAnswerDto {
  @IsString()
  @Length(1, 150)
  answer: string;

  @IsBoolean()
  isCorrect: boolean;
}
