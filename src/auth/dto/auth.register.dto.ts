import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators/password.strengh.validator';
import { IsNotTempMail } from 'src/common/decorators/tempMail.validator';
import { IsValidBirthdate } from 'src/common/decorators/birthdate.validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 26)
  firstname: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 26)
  lastname: string;

  @IsDateString()
  @IsValidBirthdate()
  @IsNotEmpty()
  birthdate: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 26)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 10)
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  role: string;

  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 50)
  email: string;

  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  @Length(3, 20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 26)
  @IsStrongPasswordZXCVBN() // zu beachten das hier ein score und message als default gesetzt ist
  password: string;
}
