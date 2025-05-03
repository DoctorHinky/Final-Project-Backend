import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNotTempMail } from 'src/common/decorators/tempMail.validator';

export class BaseFamilyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  email?: string;

  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  @IsOptional()
  phone?: string;
}
