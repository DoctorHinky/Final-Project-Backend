import { IsEnum } from 'class-validator';

export class CreateModsAndAdminsDto {
  @IsEnum(['MODERATOR', 'ADMIN'])
  targetRole: 'MODERATOR' | 'ADMIN';
}
