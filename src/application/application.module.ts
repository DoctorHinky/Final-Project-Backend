import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [PrismaModule, CloudinaryModule],
})
export class ApplicationModule {}
