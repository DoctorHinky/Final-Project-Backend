import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { IsNotTempMail } from 'src/common/decorators';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  // das muss noch eingestellt werden wir habe noch keine verbindung zu cloudinary
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
