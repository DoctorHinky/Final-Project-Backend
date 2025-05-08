import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private async generateTokens(user: User): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId: user.id,
          role: user.role,
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
      throw new ForbiddenException('User not found');
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

  passwordChange() {}
  passwordReset() {}
  verifyEmail() {}
  getMe() {}
  deleteUser() {}
  restoreUser() {}

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
