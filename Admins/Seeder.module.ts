import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeedService } from './SeederService';

@Module({
  imports: [PrismaModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
