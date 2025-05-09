import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { UserRoles } from '@prisma/client';
import { hashPassword } from 'src/auth/utils/password.utils';
import { PrismaService } from 'src/prisma/prisma.service';
config({ path: '.env.admin' });

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  admin = {
    firstname: process.env.ADMIN_FIRSTNAME,
    lastname: process.env.ADMIN_LASTNAME,
    username: process.env.ADMIN_USERNAME,
    birthdate: process.env.ADMIN_BIRTHDATE,
    email: process.env.ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE,
    password: process.env.ADMIN_PASSWORD,
  };

  async seedAdmin() {
    const { firstname, lastname, username, birthdate, email, phone, password } =
      this.admin;

    if (
      !firstname ||
      !lastname ||
      !username ||
      !birthdate ||
      !email ||
      !phone ||
      !password
    ) {
      throw new Error(
        'Missing required environment variables for admin seeding',
      );
    }

    const existingAdmin = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingAdmin) {
      const hash = await hashPassword(password);
      const admin = {
        firstname,
        lastname,
        username,
        birthdate: new Date(birthdate),
        email,
        phone,
        password: hash,
        role: UserRoles.ADMIN,
      };

      await this.prisma.user.create({ data: admin });
      console.log('Admin found');
    }
    console.log('Database is ready to use');
  }

  async onModuleInit() {
    await this.seedAdmin();
  }
}
