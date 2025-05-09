import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequiredRoles = (...role: string[]) =>
  SetMetadata(ROLES_KEY, role);
