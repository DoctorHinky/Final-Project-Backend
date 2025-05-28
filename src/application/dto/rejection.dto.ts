import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  reason: string;
}
