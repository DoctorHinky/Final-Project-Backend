import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword, verifyPassword } from './utils/password.utils';
import { RegisterDto } from './dto/auth.register.dto';
import { UserRoles, Prisma, User } from '@prisma/client';
import { LoginDto } from './dto/auth.login.dto';
import { Tokens } from './types/token.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async generateTokens(user: User): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId: user.id,
          role: user.role,
          username: user.username,
        },
        {
          expiresIn: 60 * 15,
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        },
      ),
      this.jwtService.signAsync(
        {
          userId: user.id,
          role: user.role,
        },
        {
          expiresIn: 60 * 60 * 24 * 7,
          secret: this.config.get('JWT_REFRESH_SECRET'),
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async localRegister(user: RegisterDto) {
    const { username, firstname, lastname, birthdate, email, phone, password } =
      user;
    try {
      user.role = user.role === 'CHILD' ? UserRoles.CHILD : UserRoles.ADULT;
      // create the User
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;

      const newUser = await this.prisma.user.create({
        data: {
          username,
          firstname,
          lastname,
          birthdate: new Date(birthdate),
          role: user.role as UserRoles,
          email,
          phone,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          firstname: true,
          lastname: true,
          birthdate: true,
          role: true,
          email: true,
          phone: true,
          password: false,
        },
      });

      const tokens = await this.generateTokens(newUser as User);

      // save the hashed refresh token in the database
      await this.updateRtHash(newUser.id, tokens.refresh_token);
      await this.sendVerificationEmail(newUser.id, email);

      // return the tokens
      // we can also return the user data if needed
      // but for now we will only return the tokens
      // so we can use them in the frontend

      return tokens;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ForbiddenException(
            'And user with this some of choosen credentials already exists',
          );
        } else {
          throw new Error('Unknow error: ' + err.message);
        }
      }
    }
  }

  async localLogin(user: LoginDto): Promise<Tokens> {
    const { username, email, password } = user;

    if (!username && !email) {
      throw new BadRequestException('email or username is required');
    }

    let dbUser: User | null = null;

    if (username) {
      dbUser = await this.prisma.user.findUnique({
        where: {
          username,
        },
      });
    } else if (email) {
      dbUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
    }
    if (!dbUser) throw new UnauthorizedException('Invalid credentials');

    const passwordCheck = await verifyPassword(password, dbUser.password);
    if (!passwordCheck) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(dbUser);
    await this.prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordResetToken: null },
    });
    await this.updateRtHash(dbUser.id, tokens.refresh_token);

    return tokens;
  }
  async logout(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }
  async refreshTokens(userId: string, refreshToken: string) {
    const user: User | null = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access denied');
    }
    const refreshTokenMatches = await verifyPassword(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      // await this.logout(userId);
      throw new ForbiddenException('Invalid refresh token');
    }

    const newTokens = await this.generateTokens(user);
    await this.updateRtHash(userId, newTokens.refresh_token);

    return newTokens;
  }
  // die muss auch noch in den User service (updaten der email)
  async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<{ message: string }> {
    const payload = { sub: userId, email };
    const token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
      expiresIn: '5m', // 5 minutes
    });

    const hashedToken = await hashPassword(token);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      },
    });
    const verificationLink = `${this.config.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    await this.mailService.sendEmailVerification(email, { verificationLink }); // In der mail muss der normal token stehen, damit der User ihn in der URL verwenden kann
    console.log(`Verification email sent to ${email}`);
    return { message: 'email for verification has benn sendet' };
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
      }>(token, {
        secret: this.config.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
      });

      if (!payload?.sub) {
        throw new ForbiddenException('Invalid token');
      }

      const tokens = await this.prisma.emailVerificationToken.findMany({
        where: {
          userId: payload.sub,
          expiresAt: { gt: new Date() }, // Check if the token is not expired
        },
      });

      const matched = await Promise.any(
        tokens.map(async (t) => {
          const isMatch = await verifyPassword(token, t.token);
          if (isMatch) return t;
          throw new Error();
        }),
      ).catch(() => null);

      if (!matched) {
        throw new ForbiddenException('Invalid or expired token');
      }

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { verified: true },
      });

      await this.prisma.emailVerificationToken.deleteMany({
        where: { userId: payload.sub },
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      console.error('Email verification error:', error);
      if (error instanceof ForbiddenException) {
        throw error; // Re-throw known exceptions
      } else {
        throw new BadRequestException('Invalid or expired token');
      }
    }
  }
  async sendResetMail(email?: string, username?: string) {
    if (!email && !username) {
      throw new BadRequestException('Email or username is required');
    }
    let user: User | null = null;
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    } else if (username) {
      user = await this.prisma.user.findUnique({
        where: { username },
      });
    }

    if (!user) throw new NotFoundException('User not found');

    const resetToken = this.jwtService.sign(
      { email: user.email },
      {
        secret: this.config.get<string>('JWT_RESET_PASSWORD_SECRET'),
        expiresIn: '5m', // 5 minutes
      },
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: await hashPassword(resetToken) },
    });

    const resetLink = `${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, {
      username: user.username,
      resetLink,
    });
    console.log(`Password reset email sent to ${user.email}`);
    return { message: 'Password reset email sent' };
  }

  async passwordReset(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify<{ email: string }>(token, {
        secret: this.config.get<string>('JWT_RESET_PASSWORD_SECRET'),
      });

      if (!payload?.email) {
        throw new ForbiddenException('Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user || !user.passwordResetToken) {
        throw new NotFoundException('User not found or reset token not set');
      }

      const isMatch = await verifyPassword(token, user.passwordResetToken);
      if (!isMatch) {
        throw new ForbiddenException('Invalid or expired token');
      }

      const hashedPassword = await hashPassword(newPassword);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null, // Clear the reset token after use
        },
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // this are helper functions that not actually belong to the service isself
  async updateRtHash(userId: string, refreshToken: string) {
    const tokenHash = await hashPassword(refreshToken);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: tokenHash,
      },
    });
  }
}
