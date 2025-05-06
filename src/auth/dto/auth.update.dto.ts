import { IsString, IsNotEmpty } from 'class-validator';
import { BaseAuthDto } from './auth.base.dto';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators/password.strengh.validator';

export class PasswordChangeDto extends BaseAuthDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN(3, { message: 'The newPassword has to be stronger' })
  newPassword: string;
}
