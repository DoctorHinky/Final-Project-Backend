import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Req } from '@nestjs/common';
import { Request } from 'express';

interface AuthRequest {
  user: {
    id: string;
  };
}

@Controller('auth')
/**
 * @description AuthController is responsible for handling authentication requests
 * @route: /auth
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  // we use any only as a placeholder, we dont have the real User DTO (DTO = Data Transfer Object) yet
  register() {
    return this.authService.register();
  }

  @Post('login')
  login() {
    return this.authService.login();
  }

  @Post('passwordChange')
  passwordChange() {
    return {
      message: 'password is changed',
    };
  }

  @Post('passwordReset')
  async passwordReset() {}

  @Post('verifyEmail')
  async verifyEmail() {}

  @Get('me')
  getMe(@Req() req: Request & AuthRequest) {
    return req.user;
  }

  @Post('deleteUser')
  // delete user will be a soft delete, we will not remove the user from the database
  async deleteUser() {}

  @Post('restoreUser')
  // restore user will only be available for users with the role of admin
  async restoreUser() {}
}
