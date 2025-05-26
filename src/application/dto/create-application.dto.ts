import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { IsNotTempMail } from 'src/common/decorators';

export class CreateApplicationDto {
  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  @Length(5, 20)
  phone: string;

  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 50)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  content?: string;

  @IsOptional()
  coverLetter?: any;

  @IsOptional()
  resume?: any;

  @IsOptional()
  certification?: any;

  @IsOptional()
  other?: any;
}
