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
import { getCurrentUser, PublicRoute } from 'src/common/decorators';
import { CreateTicketDto, GetTicketQueryDto, TicketMessageDto } from './dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';

@Controller('tickets')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(), // Store files in memory (RAM)
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit per file
    }),
  )
  createTicket(
    @getCurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketService.createTicket(userId, dto, files);
  }

  @Post(':id/message')
  createTicketMessage(
    @getCurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() message: TicketMessageDto,
  ) {
    console.log('message', message);
    return this.ticketService.createTicketMessage(userId, id, message);
  }

  @Get('all')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getTickets(@Query() query: GetTicketQueryDto) {
    return this.ticketService.getTickets(query);
  }

  @Get('by-moderator/:moderatorId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getAllTicketsByModeratorId(@Param('moderatorId') moderatorId: string) {
    return this.ticketService.getAllTicketsByModeratorId(moderatorId);
  }

  @Get('by-user/:userId')
  getAllTicketsByUserId(@Param('userId') userId: string) {
    return this.ticketService.getAllTicketsByUserId(userId);
  }

  @Get(':id')
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }

  @Patch(':id')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  updateTicketCategory(
    @getCurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: { category: string },
  ) {
    return this.ticketService.updateTicketCategory(userId, id, dto.category);
  }

  @Get('myTickets')
  getMyTickets(@getCurrentUser('id') userId: string) {
    return this.ticketService.getMyTickets(userId);
  }

  @Post(':id/take')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  takeTicket(@getCurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ticketService.takeTicket(userId, id);
  }

  @Post(':id/reopen')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  reopenTicket(@getCurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ticketService.reopenTicket(userId, id);
  }

  @Post(':id/reassign')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  reassignTicket(
    @getCurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ticketService.reassignTicket(userId, id);
  }

  @Post(':id/close')
  cancelTicket(@getCurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ticketService.cancelTicket(userId, id);
  }

  @PublicRoute()
  @Delete('clearTickets')
  deleteTickets() {
    return this.ticketService.cleanUpTicketModule();
  }

  @Delete('killswitch')
  @RequiredRoles(UserRoles.ADMIN)
  async killswitch() {
    return this.ticketService.killswitch();
  }
}
