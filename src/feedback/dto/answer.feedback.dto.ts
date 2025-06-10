import { IsString, Length } from 'class-validator';

export class AnswerFeedbackDto {
  @IsString()
  @Length(10, 500)
  content: string;
}
