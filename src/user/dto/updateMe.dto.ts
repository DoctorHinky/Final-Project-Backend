import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { IsNotTempMail } from 'src/common/decorators';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(3, 26)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 25)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 25)
  username?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @Length(3, 50)
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  @IsNotTempMail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('DE', { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 250)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  shortDescription?: string;

  // das muss noch eingestellt werden wir habe noch keine verbindung zu cloudinary
  @IsOptional()
  @IsString()
  @IsUrl()
  profilePicture?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => Boolean(value))
  @IsBoolean()
  verified?: boolean;
}
