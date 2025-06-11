import { forwardRef, Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  providers: [TicketService],
  controllers: [TicketController],
  exports: [TicketService],
  imports: [forwardRef(() => CloudinaryModule), NotificationModule],
})
export class TicketModule {}
