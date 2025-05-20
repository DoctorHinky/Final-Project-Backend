import { IsBoolean, IsString, Length } from 'class-validator';

export class QuizAnswerDto {
  @IsString()
  @Length(1, 50)
  answer: string;

  @IsBoolean()
  isCorrect: boolean;
}
