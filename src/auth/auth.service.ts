import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
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
