import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword } from './utils/password.utils';
import { FamilyRegisterDto } from './dto/fam-register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(family: FamilyRegisterDto) {
    const { name, email, phone, password } = family;
    // check if the family already exists
    const emailInUse = await this.prisma.family.findFirst({
      where: { email: email },
    });
    const phoneInUse = await this.prisma.family.findFirst({
      where: { phone: phone },
    });
    if (emailInUse || phoneInUse) {
      return { message: 'this phone number or email are already in use' };
    }

    // create the family
    const hashedPassword = await hashPassword(password);
    family.password = hashedPassword;

    const newFamily = await this.prisma.family.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    return {
      message: 'the family is registered',
      family: {
        id: newFamily.id,
        name: newFamily.name,
        email: newFamily.email,
        phone: newFamily.phone,
      },
    };
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
