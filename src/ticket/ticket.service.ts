import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto, GetTicketQueryDto, TicketMessageDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Ticket, TicketCategory, UserFile } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private NotificationService: NotificationService,
  ) {}

  private async ensureUserFile(userId: string): Promise<UserFile> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userFileId: true },
      });
      if (user?.userFileId) {
        const existingUserFile = await this.prisma.userFile.findUnique({
          where: { id: user.userFileId },
        });
        if (existingUserFile) return existingUserFile;
      }
      return this.prisma.userFile.create({
        data: { user: { connect: { id: userId } } },
      });
    } catch (error) {
      throw new BadRequestException('Error ensuring user file', {
        cause: error,
        description: 'An error occurred while ensuring the user file exists',
      });
    }
  }

  private getCategoryEnum(category: string): TicketCategory {
    const upperCategory = category.toUpperCase();
    switch (upperCategory) {
      case 'WEBSITE_BUG':
        return TicketCategory.WEBSITE_BUG;
      case 'REPORT':
        return TicketCategory.REPORT;
      case 'ACCOUNT':
        return TicketCategory.ACCOUNT;
      case 'TECHNICAL':
        return TicketCategory.TECHNICAL;
      default:
        return TicketCategory.OTHER;
    }
  }

  async createTicket(
    userId: string,
    dto: CreateTicketDto,
    files: Express.Multer.File[],
  ) {
    try {
      const userFile = await this.ensureUserFile(userId);

      // Kategorie korrekt konvertieren
      const category = this.getCategoryEnum(dto.category);

      const ticket = await this.prisma.ticket.create({
        data: {
          userFileId: userFile.id,
          title: dto.title,
          description: dto.description,
          category: category, // Kategorie hier setzen
        },
      });

      if (files && files.length > 0) {
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
      }

      return {
        message: 'Ticket created successfully',
        ticketId: ticket.id,
      };
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
    try {
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

      if (targetTicket.workedById === userId) {
        await this.NotificationService.createNotification(
          targetTicket.userFile.user.id,
          'TICKET_UPDATE',
          `You got a new message in your ticket: ${targetTicket.title}`,
        );
      }

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
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      } else {
        throw new BadRequestException('Error creating ticket message', {
          cause: error,
          description: 'An error occurred while creating the ticket message',
        });
      }
    }
  }

  async getTickets(query: GetTicketQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortDirection = 'desc',
      } = query;

      const tickets = await this.prisma.ticket.findMany({
        where: { status: status ?? undefined },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          [sortBy]: sortDirection,
        },
        include: {
          userFile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          workedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
              Files: true,
            },
          },
        },
      });

      if (!tickets || tickets.length === 0) {
        return 'Fetch successfully, but no tickets found';
      } else {
        return tickets;
      }
    } catch (error) {
      throw new BadRequestException('Error fetching tickets', {
        cause: error,
        description: 'An error occurred while fetching tickets',
      });
    }
  }

  async getAllTicketsByModeratorId(modId: string) {
    try {
      const tickets: Ticket[] = await this.prisma.ticket.findMany({
        where: { workedById: modId },
        include: {
          userFile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
              Files: true,
            },
          },
        },
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
        include: {
          workedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
              Files: true,
            },
          },
        },
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
        include: {
          workedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
              Files: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
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
          userFile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          workedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          messages: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          Files: true,
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
        data: {
          workedById: userId,
          status: 'IN_PROGRESS',
        },
      });
      if (!ticket) return 'No ticket under this id';

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
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: id },
        include: { userFile: { include: { user: true } } },
      });

      if (!ticket || !ticket.userFile?.user) {
        throw new BadRequestException('cant load ticket or userFile or user');
      }

      if (ticket.userFile.user.id !== userId) {
        throw new ForbiddenException(
          'thats not your ticket, you cant cancel it',
        );
      }

      await this.prisma.ticket.update({
        where: { id: id },
        data: {
          status: 'CANCELED',
        },
      });

      if (ticket.workedById) {
        await this.NotificationService.createNotification(
          ticket.workedById,
          'SYSTEM',
          `The ticket with ID ${id} has been canceled by the user.`,
        );
      }
      return `Ticket with ID ${id} has been canceled`;
    } catch (error) {
      throw new BadRequestException('Error canceling ticket', {
        cause: error,
        description: 'An error occurred while canceling the ticket',
      });
    }
  }

  async closeTicket(id: string) {
    try {
      const ticket = await this.prisma.ticket.update({
        where: { id: id },
        data: { status: 'CLOSED' },
      });

      if (!ticket) {
        throw new BadRequestException('cant load ticket');
      }

      return 'Ticket closed successfully';
    } catch (error) {
      throw new BadRequestException('Error closing ticket', {
        cause: error,
        description: 'An error occurred while closing the ticket',
      });
    }
  }

  async cleanUpTicketModule() {
    try {
      const deleted: string[] = [];

      const inActiveTickets = await this.prisma.ticket.findMany({
        where: {
          NOT: { status: 'CLOSED' },
          updatedAt: {
            lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks
          },
        },
        include: {
          userFile: {
            include: {
              user: true,
            },
          },
        },
      });

      if (inActiveTickets.length !== 0) {
        for (const ticket of inActiveTickets) {
          const newestMessage = await this.prisma.ticketMessage.findFirst({
            where: { ticketId: ticket.id },
            orderBy: { createdAt: 'desc' },
          });

          if (newestMessage) {
            const ticketUserId = ticket.userFile.user?.id;

            if (ticketUserId && ticketUserId !== newestMessage.authorId) {
              await this.closeTicket(ticket.id);
            }
          }
        }
      }

      const ticketsToDelete = await this.prisma.ticket.findMany({
        where: {
          AND: { status: 'CLOSED' },
          updatedAt: { lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
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
    } catch (error) {
      console.error('Error during ticket module cleanup:', error);
      throw new BadRequestException('Error during ticket module cleanup', {
        cause: error,
        description: 'An error occurred while cleaning up the ticket module',
      });
    }
  }

  async killswitch() {
    try {
      await this.prisma.ticketFile.deleteMany({});
      await this.prisma.ticket.deleteMany({});
      await this.prisma.history.deleteMany({});
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
