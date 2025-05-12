import { IsOptional, IsString, Length } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @Length(8, 200)
  @IsString()
  deleteReason: string;
}
