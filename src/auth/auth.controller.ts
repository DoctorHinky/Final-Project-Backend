import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  Patch,
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

  @Post('passwordReset')
  async passwordReset() {}

  @PublicRoute()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
  }

  @PublicRoute()
  @Post('password-reset-mail')
  async sendResetMail(
    @Body('email') email?: string,
    @Body('username') username?: string,
  ) {
    return await this.authService.sendResetMail(email, username);
  }

  @PublicRoute()
  @Patch('password-reset')
  async resetPassword(
    @Query('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.passwordReset(token, newPassword);
  }
}
