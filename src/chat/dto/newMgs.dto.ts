import { IsNotEmpty, IsString, Length } from 'class-validator';

export class NewMessageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 1500)
  message?: string;
}
