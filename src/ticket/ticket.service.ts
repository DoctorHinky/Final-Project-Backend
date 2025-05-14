import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto, GetTicketQueryDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

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
    try {
      // sicherstellen das wie eine Akte habe
      let UserFile = await this.prisma.userFile.findUnique({
        where: { userId: userId },
      });
      if (!UserFile) {
        try {
          const createdFile = await this.prisma.userFile.create({
            data: { user: { connect: { id: userId } } },
          });

          UserFile = await this.prisma.userFile.findUnique({
            where: { id: createdFile.id },
          });

          if (!UserFile) {
            throw new BadRequestException('UserFile creation failed');
          }

          await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userFile: true },
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
      console.log('files uploaded');

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

  getAllTicketsByModeratorId() {
    // TODO: Implement getAllTicketsByModeratorId
  }

  getAllTicketsByUserId() {
    // TODO: Implement getAllTicketsByUserId
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
}
