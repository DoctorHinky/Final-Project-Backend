import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { BaseFamilyDto } from './auth.base.dto';
import { IsStrongPasswordZXCVBN } from 'src/common/decorators/password.strengh.validator';

export class FamilyPasswordChangeDto extends BaseFamilyDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordZXCVBN(3, { message: 'The newPassword has to be stronger' })
  newPassword: string;
}

export class FamilyUpdateDto extends PartialType(BaseFamilyDto) {
  @IsString()
  @IsOptional()
  @IsString({ each: true })
  members?: string[];
}
