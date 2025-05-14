import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { getCurrentUser } from 'src/common/decorators';
import { CreateTicketDto, GetTicketQueryDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';

@Controller('tickets')
export class TicketController {
  constructor(
    private ticketService: TicketService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      // Limit to 5 files
      storage: memoryStorage(), // Store files in memory (RAM)
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit per file
    }),
  )
  async createTicket(
    @getCurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketService.createTicket(userId, dto, files);
  }

  @Get('all')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getTickets(@Query() query: GetTicketQueryDto) {
    return this.ticketService.getTickets(query);
  }

  @Get('by-moderator/:moderatorId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getAllTicketsByModeratorId(@Param('moderatorId') moderatorId: string) {
    // Implement logic to get all tickets by moderator ID
    return this.ticketService.getAllTicketsByModeratorId(moderatorId);
  }

  @Get('by-user/:userId')
  getAllTicketsByUserId(@Param('userId') userId: string) {
    // Implement logic to get all tickets by user ID
    return this.ticketService.getAllTicketsByUserId(userId);
  }

  @Get(':id')
  getTicketById() {
    // Implement logic to get ticket by ID
    return this.ticketService.getTicketById();
  }

  @Get('myTickets')
  getMyTickets(@getCurrentUser('id') userId: string) {
    // Implement logic to get my tickets
    return this.ticketService.getMyTickets(userId);
  }

  @Patch(':id')
  updateTicket() {
    // Implement logic to update a ticket
    return this.ticketService.updateTicket();
  }

  @Post(':id/take')
  takeTicket() {
    // Implement logic to take a ticket
    return this.ticketService.takeTicket();
  }

  @Post(':id/reassign')
  reassignTicket() {
    // Implement logic to reassign a ticket
    return this.ticketService.reassignTicket();
  }

  @Post(':id/cancel')
  cancelTicket() {
    // Implement logic to cancel a ticket
    return this.ticketService.cancelTicket();
  }

  @Post(':id/close')
  closeTicket() {
    // Implement logic to close a ticket
    return this.ticketService.closeTicket();
  }

  @Delete('killswitch')
  @RequiredRoles(UserRoles.ADMIN)
  async killswitch() {
    return this.ticketService.killswitch();
  }
}
