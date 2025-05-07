import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword, verifyPassword } from './utils/password.utils';
import { RegisterDto } from './dto/auth.register.dto';
import { UserRoles, Prisma } from '@prisma/client';
import { LoginDto } from './dto/auth.login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(user: RegisterDto) {
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
      return {
        message: 'new User is created',
        user: newUser,
      };
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
  async login(user: LoginDto) {
    const { username, email, password } = user;

    const dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });
    if (!dbUser) throw new UnauthorizedException('Invalid credentials');

    const passwordCheck = await verifyPassword(password, dbUser.password);

    if (!passwordCheck) throw new UnauthorizedException('Invalid credentials');

    return 'hallo';
  }
  passwordChange() {}
  passwordReset() {}
  verifyEmail() {}
  getMe() {}
  deleteUser() {}
  restoreUser() {}
}
