import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNotTempMail } from 'src/common/decorators/tempMail.validator';

export class BaseAuthDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username?: string;

  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsEmail()
  @IsOptional()
  @IsNotTempMail()
  email?: string;

  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  @IsOptional()
  phone?: string;
}
