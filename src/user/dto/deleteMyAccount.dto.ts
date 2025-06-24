import { IsOptional, IsString, Length } from 'class-validator';

export class DeleteMyAccountDto {
  @IsString()
  @Length(8, 50)
  password: string;

  @IsOptional()
  @Length(8, 200)
  @IsString()
  deleteReason: string;
}
