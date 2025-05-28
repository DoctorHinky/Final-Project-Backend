import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { QuizAnswerDto } from './create-quiz-answer.dto';

export class QuizQuestionDto {
  @IsString()
  @Length(10, 150)
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];

  @IsOptional()
  @IsString()
  @Length(10, 250)
  explanation: string;
}
