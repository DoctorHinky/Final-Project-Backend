import { IsOptional, IsString, Length } from 'class-validator';

export class DeleteReasonDto {
  @IsOptional()
  @IsString()
  @Length(5, 250)
  reason?: string;
}
