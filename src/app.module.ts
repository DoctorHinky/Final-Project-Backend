import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { Authmodule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    Authmodule,
    UserModule,
    PrismaModule,
  ],
  providers: [{ provide: 'APP_GUARD', useClass: AtGuard }],
})
export class AppModule {}
