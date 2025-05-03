import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNotTempMail } from 'src/common/decorators/tempMail.validator';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators/password.strengh.validator';

export class FamilyRegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail({ message: 'Temporary email addresses are not allowed' })
  email: string;

  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN() // zu beachten das hier ein score und message als default gesetzt ist
  password: string;
}
