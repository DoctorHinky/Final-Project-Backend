import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { QuizQuestionDto } from './create-quiz-question.dto';

export class CreateQuizDto {
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}
