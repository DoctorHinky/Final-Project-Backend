import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword, verifyPassword } from './utils/password.utils';
import { RegisterDto } from './dto/auth.register.dto';
import { UserRoles } from '@prisma/client';
import { LoginDto } from './dto/auth.login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(user: RegisterDto) {
    const { username, firstname, lastname, birthdate, email, phone, password } =
      user;
    // check if the User already exists
    const emailInUse = await this.prisma.user.findFirst({
      where: { email: email },
    });
    const phoneInUse = await this.prisma.user.findFirst({
      where: { phone: phone },
    });
    if (emailInUse || phoneInUse) {
      throw new BadRequestException(
        'This phone number or email is already in use',
      );
    }
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
  }
  async login(user: LoginDto) {
    const { username, email, password } = user;

    const dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });
    if (!dbUser) throw new BadRequestException('Invalid credentials');

    const passwordCheck = await verifyPassword(password, dbUser.password);

    if (!passwordCheck) throw new BadRequestException('Invalid credentials');

    return 'hallo';
  }
  passwordChange() {}
  passwordReset() {}
  verifyEmail() {}
  getMe() {}
  deleteUser() {}
  restoreUser() {}
}
