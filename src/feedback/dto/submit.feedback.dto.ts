import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Max, Min } from 'class-validator';

export class SubmitFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  content: string;

  @Type(() => Number)
  @Max(5)
  @Min(0)
  rating: number;

  @Type(() => Boolean)
  @IsNotEmpty()
  allowedToPublish: boolean;
}
