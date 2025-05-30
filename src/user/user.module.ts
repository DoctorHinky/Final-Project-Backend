import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [CloudinaryModule, JwtModule, MailModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // den brauchen wir einmal im CloudinaryService
})
export class UserModule {}
