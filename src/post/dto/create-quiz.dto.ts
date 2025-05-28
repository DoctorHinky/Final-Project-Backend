import { Type } from 'class-transformer';
import { IsString, Length, ValidateNested } from 'class-validator';
import { QuizQuestionDto } from './create-quiz-question.dto';

export class CreateQuizDto {
  @IsString()
  @Length(5, 25)
  title: string;

  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}
