import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto, GetTicketQueryDto } from './dto';
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

  createTicketMessage() {}

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
      const ticket: Ticket | null = await this.prisma.ticket.findUnique({
        where: { id },
      });

      return ticket;
    } catch (error) {
      throw new BadRequestException('Error fetching ticket', {
        cause: error,
        description: 'An error occurred while fetching the ticket by ID',
      });
    }
  }
  updateTicket() {
    // TODO: Implement updateTicket
  }

  takeTicket() {
    // TODO: Implement takeTicket
  }

  reassignTicket() {
    // TODO: Implement reassignTicket
  }

  cancelTicket() {
    // TODO: Implement cancelTicket
  }

  closeTicket() {
    // TODO: Implement closeTicket
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
