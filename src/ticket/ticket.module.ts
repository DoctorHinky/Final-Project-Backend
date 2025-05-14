import { forwardRef, Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [TicketService],
  controllers: [TicketController],
  exports: [TicketService],
  imports: [forwardRef(() => CloudinaryModule)],
})
export class TicketModule {}
