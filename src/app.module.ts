import { Module } from '@nestjs/common';
import { Authmodule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [Authmodule, UserModule, PrismaModule],
})
export class AppModule {}
