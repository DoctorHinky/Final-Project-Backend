import { IsString, Length } from 'class-validator';

export class TicketMessageDto {
  @IsString()
  @Length(1, 5000)
  message: string;
}
