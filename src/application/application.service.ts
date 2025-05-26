import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateApplicationDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  ApplicationDocType,
  ApplicationStatus,
  UserRoles,
} from '@prisma/client';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async sendApplication(
    userId: string,
    application: CreateApplicationDto,
    files: {
      resume?: Express.Multer.File[];
      certification?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
      other?: Express.Multer.File[];
    },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { blockedForApplication: true, id: true, role: true },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.role === UserRoles.ADMIN || user.role === UserRoles.MODERATOR) {
        throw new ForbiddenException(
          'Admins and moderators cannot send applications. Please use a different account.',
        );
      } else if (user.role === UserRoles.AUTHOR) {
        throw new ForbiddenException(
          'You are already an author. You cannot send applications.',
        );
      }

      if (user?.blockedForApplication) {
        throw new ForbiddenException(
          'Application cancelled, you are blocked from sending applications.',
        );
      }

      const applicationContent = await this.prisma.application.create({
        data: {
          userId: user.id,
          phone: application.phone,
          email: application.email.toLowerCase(),
          content: application.content?.trim() || 'no free content provided',
        },
      });

      const applicationDocTypeMap: Record<string, ApplicationDocType> = {
        resume: ApplicationDocType.RESUME,
        certification: ApplicationDocType.CERTIFICATION,
        coverLetter: ApplicationDocType.COVER_LETTER,
        other: ApplicationDocType.OTHER,
      };

      for (const [category, fileArray] of Object.entries(files)) {
        if (!fileArray || fileArray.length === 0) continue;

        for (const file of fileArray) {
          if (!file || !file.buffer) {
            throw new BadRequestException(
              `Invalid file or missing buffer property for ${category}.`,
            );
          }

          const uploadResult = await this.cloudinary.uploadFile(
            file,
            'applications',
          );

          await this.prisma.applicationDocument.create({
            data: {
              applicationId: applicationContent.id,
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              type: applicationDocTypeMap[category] || ApplicationDocType.OTHER,
            },
          });
        }
      }
      return {
        message: 'Application sent successfully',
        applicationId: applicationContent.id,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while processing the application. Please try again later.',
        );
      }
    }
  }

  async getApplications(
    query: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' = 'ALL',
  ) {
    try {
      let status: ApplicationStatus | undefined;

      switch (query) {
        case 'ALL':
          status = undefined;
          break;
        case 'PENDING':
          status = ApplicationStatus.PENDING;
          break;
        case 'ACCEPTED':
          status = ApplicationStatus.ACCEPTED;
          break;
        case 'REJECTED':
          status = ApplicationStatus.REJECTED;
          break;
        case 'IN_PROGRESS':
          status = ApplicationStatus.IN_PROGRESS;
          break;
        default:
          status = undefined;
          break;
      }

      const applications = await this.prisma.application.findMany({
        where: status ? { status } : {},
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });

      return applications.map((app) => ({
        ...app,
        user: {
          ...app.user,
          profilePicture: app.user?.profilePicture
            ? app.user.profilePicture
            : null,
        },
      }));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while fetching applications. Please try again later.',
        );
      }
    }
  }

  async seeMyApplication(userId: string) {
    try {
      const applications = await this.prisma.application.findMany({
        where: { userId },
        include: { referenceDocument: true },
      });

      if (!applications || applications.length === 0) {
        throw new NotFoundException('Application not found');
      }

      return {
        message: 'Application fetched successfully',
        data: applications.map((application) => ({
          ...application,
          referenceDocument: application.referenceDocument
            ? application.referenceDocument.map((doc) => ({
                url: doc.url,
              }))
            : [],
        })),
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while fetching your application. Please try again later.',
        );
      }
    }
  }
  // for mods when they work on an application
  async takeApplication(userId: string, applicationId: string) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException(
          'Application is not in a state that can be taken.',
        );
      }

      const updatedApplication = await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.IN_PROGRESS,
          modId: userId,
        },
      });

      return {
        message: 'Application is now being worked on',
        data: updatedApplication,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while taking the application. Please try again later.',
        );
      }
    }
  }

  async acceptApplication(userId: string, applicationId: string) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
          referenceDocument: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Application is not in a state that can be accepted.',
        );
      }

      if (application.userId === null) {
        throw new BadRequestException(
          'Application has no user associated with it.',
        );
      }

      const updatedApplication = await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.ACCEPTED,
          modId: userId,
        },
      });

      const otherApplications = await this.prisma.application.findMany({
        where: { userId: application.userId, NOT: { id: applicationId } },
        include: { referenceDocument: true },
      });

      if (otherApplications.length > 0) {
        const deletionTasks = otherApplications.map(async (otherApp) => {
          try {
            // delete documents if they exist from Cloudinary
            if (otherApp.referenceDocument?.length > 0) {
              const docDeletions = otherApp.referenceDocument
                .filter((doc) => doc.publicId)
                .map((doc) =>
                  this.cloudinary.deleteFile(doc.publicId).catch((err) => {
                    console.error(
                      `Fehler beim Löschen von Dokument ${doc.publicId} (Application ${otherApp.id}):`,
                      err,
                    );
                  }),
                );

              await Promise.all(docDeletions);
            }

            // delete the application
            await this.prisma.application.delete({
              where: { id: otherApp.id },
            });
          } catch (error) {
            console.error(
              `Error while deleting application with following id: ${otherApp.id}:`,
              error,
            );
          }
        });

        // parallel deletion of other applications
        await Promise.all(deletionTasks);
      }

      await this.prisma.user.update({
        where: { id: application.userId },
        data: {
          role: UserRoles.AUTHOR,
          authorizedBy: userId,
          authorizedAt: new Date(),
        },
      });

      // hier muss dann die mail versedent werden

      return {
        message: 'Application accepted successfully',
        data: updatedApplication,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while accepting the application. Please try again later.',
        );
      }
    }
  }

  async cleanupApplications() {
    const now = new Date();
    const halfYear = 6 * 30 * 24 * 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    let deletions = 0;

    const queries = [
      {
        label: 'REJECTED',
        condition: {
          status: ApplicationStatus.REJECTED,
          updatedAt: {
            lt: new Date(now.getTime() - halfYear),
          },
        },
      },
      {
        label: 'CANCELED',
        condition: {
          status: ApplicationStatus.CANCELED,
          updatedAt: {
            lt: new Date(now.getTime() - oneWeek), // 1 Woche
          },
        },
      },
      {
        label: 'LOST',
        condition: {
          userId: null,
        },
      },
    ];

    // loop over queries to handle different conditions
    for (const query of queries) {
      const applications = await this.prisma.application.findMany({
        where: query.condition,
        include: {
          referenceDocument: true,
        },
      });

      if (applications.length === 0) continue;

      // preparing for parallel deletion
      const deletionTasks = applications.map(async (application) => {
        // delete documents if they exist from Cloudinary
        if (application.referenceDocument?.length > 0) {
          const docDeletions = application.referenceDocument
            .filter((doc) => doc.publicId)
            .map((doc) =>
              this.cloudinary.deleteFile(doc.publicId).catch((err) => {
                console.error(
                  `Failed to delete document ${doc.publicId}:`,
                  err,
                );
              }),
            );

          await Promise.all(docDeletions); // parallel deletion of documents
        }

        // delete application from the database
        await this.prisma.application.delete({
          where: { id: application.id },
        });

        deletions++;
      });

      // finish all deletion tasks in simultaneous
      await Promise.all(deletionTasks);
    }

    return {
      message:
        'Cancelled, rejected or orphaned applications have been removed.',
      deletions,
    };
  }
}
