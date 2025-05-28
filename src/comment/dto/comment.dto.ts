import { IsNotEmpty, IsString, Max } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  @Max(255)
  content: string;
}
