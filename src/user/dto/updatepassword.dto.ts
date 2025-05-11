import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators';

export class updatePassword {
  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN()
  newPassword: string;
}
