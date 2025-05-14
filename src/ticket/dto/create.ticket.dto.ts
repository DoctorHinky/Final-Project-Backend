import { IsString, Length } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(10, 50)
  quickDescription: string;

  @IsString()
  @Length(25, 500)
  description: string;
}
