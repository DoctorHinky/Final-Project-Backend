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
    let UserFile: UserFile | null = null;
    try {
      // sicherstellen das wie eine Akte habe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userFileId: true },
      });
      if (user?.userFileId) {
        UserFile = await this.prisma.userFile.findUnique({
          where: { id: user?.userFileId },
        });
      } else {
        try {
          const createdFile = await this.prisma.userFile.create({
            data: {},
          });

          await this.prisma.user.update({
            where: { id: userId },
            data: { userFileId: createdFile.id },
          });

          const UserWithFile = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { userFileId: true },
          });

          if (!UserWithFile?.userFileId) {
            throw new BadRequestException('UserFile not found', {
              description: 'UserFile not found',
            });
          }
          UserFile = await this.prisma.userFile.findUnique({
            where: { id: UserWithFile?.userFileId },
          });
        } catch (error) {
          throw new BadRequestException('UserFile creation failed', {
            cause: error,
            description: 'An error occurred while creating the UserFile',
          });
        }
      }
      if (!UserFile) {
        throw new BadRequestException('User has no File', {
          description: 'User has no file, and could not be created',
        });
      }

      // ticket erstellen
      const ticket = await this.prisma.ticket.create({
        data: {
          userFileId: UserFile.id,
          quickDescription: dto.quickDescription,
          description: dto.description,
        },
      });

      // datein hochladen
      const uploadFile = files.map(async (file) => {
        console.log('file upload', file.originalname);
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

      await Promise.all(uploadFile);

      return 'Ticket created successfully'; // später dann geht all ticket of user
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
      const userFile = await this.prisma.userFile.findUnique({
        where: { userId: userId },
      });
      console.log('userFile', userFile);

      if (!userFile) {
        throw new BadRequestException('Cant fetch tickets', {
          description: 'User has no file',
        });
      }

      /* const tickets: Ticket[] = userFile.tickets;
      if (!tickets || tickets.length === 0) {
        return 'Fetch successfully, but no tickets where this userId';
      } */
      return userFile;
    } catch (error) {
      throw new BadRequestException('Error fetching tickets', {
        cause: error,
        description:
          'An error occurred while fetching tickets, under this userId',
      });
    }
  }

  getMyTickets(userId: string) {
    return userId;
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

  getTicketById() {
    // TODO: Implement getTicketById
  }

  cancelTicket() {
    // TODO: Implement cancelTicket
  }

  closeTicket() {
    // TODO: Implement closeTicket
  }

  async killswitch() {
    try {
      await this.prisma.ticket.deleteMany({});
      await this.prisma.ticketFile.deleteMany({});
      await this.prisma.userFile.deleteMany({});
      await this.prisma.user.deleteMany({});
      await this.prisma.ticketMessage.deleteMany({});

      return 'All tickets and related data have been deleted successfully';
    } catch (error) {
      throw new Error(error);
    }
  }
}
