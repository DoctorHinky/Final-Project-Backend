import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto, GetTicketQueryDto, TicketMessageDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Ticket, UserFile } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createTicket(
    userId: string,
    dto: CreateTicketDto,
    files: Express.Multer.File[],
  ) {
    let userFile: UserFile | null = null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userFileId: true },
      });

      if (user?.userFileId) {
        userFile = await this.prisma.userFile.findUnique({
          where: { id: user.userFileId },
        });
      }

      if (!userFile) {
        userFile = await this.prisma.userFile.create({
          data: {
            user: { connect: { id: userId } },
          },
        });
      }

      const ticket = await this.prisma.ticket.create({
        data: {
          userFileId: userFile.id,
          quickDescription: dto.quickDescription,
          description: dto.description,
        },
      });
      const uploadTasks = files.map(async (file) => {
        const result = await this.cloudinaryService.uploadFile(
          file,
          `ticket/${ticket.id}`,
        );

        return this.prisma.ticketFile.create({
          data: {
            ticketId: ticket.id,
            url: result.secure_url,
            publicId: result.public_id,
          },
        });
      });

      await Promise.all(uploadTasks);

      return 'Ticket created successfully';
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new BadRequestException('Ticket creation failed', {
          cause: error,
          description: 'An error occurred while creating the ticket',
        });
      }
    }
  }

  async createTicketMessage(
    userId: string,
    id: string,
    message: TicketMessageDto,
  ) {
    const targetTicket = await this.prisma.ticket.findUnique({
      where: { id: id, AND: { NOT: { status: 'CLOSED' } } },
      include: { userFile: { include: { user: true } } },
    });

    if (!targetTicket || !targetTicket.userFile?.user) {
      throw new BadRequestException(
        'no ticket under this Id, or ticket has no userFile',
      );
    } else if (
      targetTicket.userFile.user.id !== userId &&
      targetTicket.workedById !== userId
    ) {
      throw new ForbiddenException(
        'You are not allowed to send a message to this ticket',
      );
    }

    const ticketMessage = await this.prisma.ticketMessage.create({
      data: {
        content: message.message,
        ticketId: id,
        authorId: userId,
      },
    });

    if (!ticketMessage) {
      throw new BadRequestException('cant create ticket message');
    }

    const allMessages = await this.prisma.ticketMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.ticket.update({
      where: { id: id },
      data: {
        updatedAt: new Date(),
        messages: {
          connect: { id: ticketMessage.id },
        },
      },
    });

    return allMessages;
  }

  async getTickets(query: GetTicketQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortDirection = 'desc',
    } = query;

    console.log('status', status);

    console.log('query', query);

    const tickets = await this.prisma.ticket.findMany({
      where: { status: status ?? undefined },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sortBy]: sortDirection,
      },
    });

    if (!tickets || tickets.length === 0) {
      return 'Fetch successfully, but no tickets found';
    } else {
      return tickets;
    }
  }

  async getAllTicketsByModeratorId(modId: string) {
    try {
      const tickets: Ticket[] = await this.prisma.ticket.findMany({
        where: { workedById: modId },
      });
      if (!tickets || tickets.length === 0) {
        return 'Fetch successfully, but no tickets where this mod is working on';
      } else {
        return tickets;
      }
    } catch (error) {
      throw new BadRequestException('Error fetching tickets', {
        cause: error,
        description:
          'An error occurred while fetching tickets, under this moderatorId',
      });
    }
  }

  async getAllTicketsByUserId(userId: string) {
    try {
      const tickets: Ticket[] | null = await this.prisma.ticket.findMany({
        where: { userFile: { user: { id: userId } } },
      });

      if (!tickets || tickets.length === 0) {
        return 'Fetch successfully, but no tickets where this user is the owner';
      }
      return tickets;
    } catch (error) {
      throw new BadRequestException('Error fetching tickets', {
        cause: error,
        description:
          'An error occurred while fetching tickets, under this userId',
      });
    }
  }

  async getMyTickets(userId: string) {
    try {
      return await this.prisma.ticket.findMany({
        where: {
          userFile: {
            user: {
              id: userId,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Error fetching tickets', {
        cause: error,
        description: 'An error occurred while fetching tickets',
      });
    }
  }

  async getTicketById(id: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: {
          id: id,
        },
        include: {
          userFile: true, // UserAkte
          workedBy: true, // Moderator
          messages: {
            include: {
              author: true, // Autor der Nachricht
            },
          },
          Files: true, // Hochgeladene Dateien (z.B. Screenshots)
        },
      });

      return ticket;
    } catch (error) {
      throw new BadRequestException('Error fetching ticket', {
        cause: error,
        description: 'An error occurred while fetching the ticket by ID',
      });
    }
  }
  async takeTicket(userId: string, id: string) {
    try {
      const ticket = await this.prisma.ticket.update({
        where: { id: id },
        data: { workedById: userId },
      });
      if (!ticket) {
        return 'No ticket under this id';
      }

      return ticket;
    } catch (error) {
      throw new BadRequestException('Error taking ticket', {
        cause: error,
        description: 'An error occurred while taking the ticket',
      });
    }
  }

  async reassignTicket(userId: string, id: string) {
    try {
      const ticket = await this.prisma.ticket.update({
        where: { id: id },
        data: { workedById: userId },
      });
      if (!ticket) {
        return 'No ticket under this id';
      }
      // hier sollte eine Benachrichtigung an den neuen Moderator gesendet werden

      return ticket;
    } catch (error) {
      throw new BadRequestException('Error reassigning ticket', {
        cause: error,
        description: 'An error occurred while reassigning the ticket',
      });
    }
  }

  async cancelTicket(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: id },
      include: { userFile: { include: { user: true } } },
    });

    if (!ticket || !ticket.userFile?.user) {
      throw new BadRequestException('cant load ticket or userFile or user');
    }

    if (ticket.userFile.user.id !== userId) {
      throw new ForbiddenException('thats not your ticket, you cant cancel it');
    }

    await this.prisma.ticket.update({
      where: { id: id },
      data: {
        status: 'CANCELED', // ← vorausgesetzt, dieser Status existiert
      },
    });

    return `Ticket with ID ${id} has been canceled`;
  }
  // diese function sollte noch im Cron integriert werden, so nach dem Motto, wenn ein Ticket länger als 2 Wochen offen ist, dann wird es geschlossen
  async closeTicket(id: string) {
    const ticket = await this.prisma.ticket.update({
      where: { id: id },
      data: { status: 'CLOSED' },
    });

    if (!ticket) {
      throw new BadRequestException('cant load ticket');
    }

    return 'Ticket closed successfully';
  }

  async cleanUpTicketModule() {
    const deleted: string[] = [];

    const inActiveTickets = await this.prisma.ticket.findMany({
      where: {
        NOT: { status: 'CLOSED' },
        updatedAt: {
          // lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks
          lte: new Date(Date.now() - 1000 * 60), // 2 weeks
        },
      },
      include: {
        userFile: {
          include: {
            user: true, // ticket.userFile.user.id
          },
        },
      },
    });
    console.log('inActiveTickets', inActiveTickets);
    console.log('inActiveTickets.length', inActiveTickets.length);

    if (inActiveTickets.length !== 0) {
      console.log('we have inActiveTickets');
      for (const ticket of inActiveTickets) {
        console.log('we work on: ', ticket.id);

        const newestMessage = await this.prisma.ticketMessage.findFirst({
          where: { ticketId: ticket.id },
          orderBy: { createdAt: 'desc' }, // neueste Nachricht zuerst
        });

        if (newestMessage) {
          const ticketUserId = ticket.userFile.user?.id;

          if (ticketUserId && ticketUserId !== newestMessage.authorId) {
            await this.prisma.ticket.update({
              where: { id: ticket.id },
              data: { status: 'CLOSED' },
            });
          }
        }
      }
    }
    const ticketsToDelete = await this.prisma.ticket.findMany({
      where: {
        AND: { status: 'CLOSED' },
        // updatedAt: { lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
        updatedAt: { lte: new Date(Date.now() - 1000 * 60) },
      },
      select: {
        id: true,
        Files: {
          select: {
            publicId: true,
          },
        },
      },
    });

    if (ticketsToDelete.length !== 0) {
      for (const ticket of ticketsToDelete) {
        const ticketFiles = ticket.Files.map((file) => {
          return this.cloudinaryService.deleteFile(file.publicId);
        });
        await Promise.all(ticketFiles);
        await this.prisma.ticketFile.deleteMany({
          where: { ticketId: ticket.id },
        });
        await this.prisma.ticketMessage.deleteMany({
          where: { ticketId: ticket.id },
        });
        await this.prisma.ticket.delete({
          where: { id: ticket.id },
        });
        deleted.push(ticket.id);
      }
    }
    return deleted;
  }

  async killswitch() {
    try {
      await this.prisma.ticketFile.deleteMany({});
      await this.prisma.ticketMessage.deleteMany({});

      await this.prisma.ticket.deleteMany({});

      await this.prisma.readPost.deleteMany({});
      await this.prisma.rating.deleteMany({});
      await this.prisma.comment.deleteMany({});
      await this.prisma.post.deleteMany({});

      await this.prisma.friendRequest.deleteMany({});
      await this.prisma.friendship.deleteMany({});

      await this.prisma.application.deleteMany({});

      await this.prisma.userFile.deleteMany({});

      await this.prisma.user.deleteMany({});

      return 'Killswitch successfully, all data deleted';
    } catch (error) {
      console.error('error while executing Killswitch', error);
      throw new Error('Killswitch failed: ' + (error as Error).message);
    }
  }
}
