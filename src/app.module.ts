import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { Authmodule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    Authmodule,
    UserModule,
    PrismaModule,
  ],
})
export class AppModule {}
