import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { UpdateMeDto } from './updateMe.dto';
import { UserRoles } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsValidBirthdate } from 'src/common/decorators';

export const AllowedRoles = {
  ADULT: UserRoles.ADULT,
  CHILD: UserRoles.CHILD,
} as const;

type AllowedRoles = (typeof AllowedRoles)[keyof typeof AllowedRoles];

export class UpdateUserDto extends UpdateMeDto {
  @IsOptional()
  @IsEnum(AllowedRoles, { message: 'Can only be ADULT or CHILD' })
  role?: AllowedRoles;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsValidBirthdate()
  birthDate?: Date;
}
