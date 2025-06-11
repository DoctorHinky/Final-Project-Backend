import { Transform } from 'class-transformer';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(10, 50)
  quickDescription: string;

  @IsString()
  @Length(25, 500)
  description: string;

  @IsString()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  @MaxLength(25)
  category: string;
}
