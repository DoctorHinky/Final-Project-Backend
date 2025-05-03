import { IsString, IsNotEmpty } from 'class-validator';
import { BaseFamilyDto } from './auth.base.dto';

export class FamilyLoginDto extends BaseFamilyDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
