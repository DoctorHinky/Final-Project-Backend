import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
