import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TrimPipe } from 'src/common/pipes/trim.pipe';
import { Tokens } from './types/token.type';
import { LoginDto, RegisterDto } from './dto';
import { AtGuard, RtGuard } from 'src/common/guards';
import { getCurrentUser, PublicRoute } from 'src/common/decorators';

@UsePipes(TrimPipe)
@Controller('auth')
/**
 * @description AuthController is responsible for handling authentication requests
 * @route: /auth
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  @PublicRoute()
  @Post('local/register')
  async localRegister(@Body() dto: RegisterDto): Promise<Tokens | void> {
    return await this.authService.localRegister(dto);
  }

  @PublicRoute()
  @Post('local/login')
  async localLogin(@Body() loginDto: LoginDto): Promise<Tokens | void> {
    return await this.authService.localLogin(loginDto);
  }

  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@getCurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @PublicRoute()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @getCurrentUser('refreshToken') refreshToken: string,
    @getCurrentUser('id') userId: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
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
