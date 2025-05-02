import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  register() {
    return 'i have to register';
  }
  login() {
    return 'i am logged in';
  }
  passwordChange() {}
  passwordReset() {}
  verifyEmail() {}
  getMe() {}
  deleteUser() {}
  restoreUser() {}
}
