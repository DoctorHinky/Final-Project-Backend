import { Module } from '@nestjs/common';
import { Authmodule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [Authmodule, UserModule],
})
export class AppModule {}
