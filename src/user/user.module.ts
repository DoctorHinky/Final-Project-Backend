import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // den brauchen wir einmal im CloudinaryService
})
export class UserModule {}
