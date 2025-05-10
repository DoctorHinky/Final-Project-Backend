import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators/password.strengh.validator';
import { IsNotTempMail } from 'src/common/decorators/tempMail.validator';
import { IsValidBirthdate } from 'src/common/decorators/birthdate.validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsDateString()
  @IsValidBirthdate()
  birthdate: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  role: string;

  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN() // zu beachten das hier ein score und message als default gesetzt ist
  password: string;
}
