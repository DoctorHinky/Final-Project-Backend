import { Transform } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';

export class CreateModsAndAdminsDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  @IsEnum(['MODERATOR', 'ADMIN'])
  targetRole: 'MODERATOR' | 'ADMIN';
}
