import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [PrismaModule, CloudinaryModule, MailModule],
})
export class ApplicationModule {}
