import { Controller, Post, Get, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.register.dto';
import { TrimPipe } from 'src/common/pipes/trim.pipe';
import { LoginDto } from './dto/auth.login.dto';

@UsePipes(TrimPipe)
@Controller('auth')
/**
 * @description AuthController is responsible for handling authentication requests
 * @route: /auth
 */
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register')
  // we use any only as a placeholder, we dont have the real User DTO (DTO = Data Transfer Object) yet
  register(@Body() dto: RegisterDto) {
    console.log('register', dto);
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    console.log('login', loginDto);
    return this.authService.login(loginDto);
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
  getMe() {}

  @Post('deleteUser')
  // delete user will be a soft delete, we will not remove the user from the database
  async deleteUser() {}

  @Post('restoreUser')
  // restore user will only be available for users with the role of admin
  async restoreUser() {}
}
