import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getUserById() {
    return 'getUser';
  }

  getAllUsers() {
    return 'getAllUsers';
  }

  getMe() {
    return 'getMe';
  }

  updateUser() {
    return 'updateUser';
  }

  updatePassword() {
    return 'updatePassword';
  }

  applyForAuthor() {
    return 'applyForAuthor';
  }

  deleteMyAccount() {
    return 'deleteMyAccount';
  }

  deactivateMyAccount() {
    return 'deactivateMyAccount';
  }

  deleteUser() {
    return 'deleteUser';
  }

  restoreUser() {
    return 'restoreUser';
  }
}
