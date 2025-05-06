import { IsString, IsNotEmpty } from 'class-validator';
import { BaseAuthDto } from './auth.base.dto';

export class LoginDto extends BaseAuthDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
