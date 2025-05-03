import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // that make the module foundable in the whole app without importing it in every module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
