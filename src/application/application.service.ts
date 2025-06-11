/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateApplicationDto, RejectionDto } from './dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  ApplicationDocType,
  ApplicationStatus,
  UserRoles,
} from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { limitConcurrency } from 'src/common/utilitys/promise-limiter';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly mailService: MailService,
    private notificationService: NotificationService,
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

      // only normal users can apply to become an author
      if (user.role === UserRoles.ADMIN || user.role === UserRoles.MODERATOR) {
        throw new ForbiddenException(
          'Admins and moderators cannot send applications. Please use a different account.',
        );
      } else if (user.role === UserRoles.AUTHOR) {
        throw new ForbiddenException(
          'You are already an author. You cannot send applications.',
        );
      }
      // if someone sendet to many applications, we block them, also if they are haters or something against our rules
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

      let documentsUploaded = 0;

      for (const [category, fileArray] of Object.entries(files)) {
        if (!fileArray || fileArray.length === 0) {
          console.log(`No files for category: ${category}`);
          continue;
        }

        for (const file of fileArray) {
          if (!file || !file.buffer) {
            console.error(
              `Invalid file or missing buffer for ${category}:`,
              file,
            );
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
          documentsUploaded++;
        }
      }

      // mail sending!
      await this.mailService.sendMail(
        application.email,
        `Your application has been received`,
        `<p>Thank you for your application. We will review it shortly.</p>`,
      );

      return {
        message: 'Application sent successfully',
        applicationId: applicationContent.id,
        documentsUploaded,
      };
    } catch (err) {
      console.error('Error in sendApplication:', err);

      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while processing the application. Please try again later.',
          {
            cause: err,
            description: 'Error while sending application',
          },
        );
      }
    }
  }

  async getApplications(
    query:
      | 'ALL'
      | 'PENDING'
      | 'CANCELED'
      | 'ACCEPTED'
      | 'REJECTED'
      | 'IN_PROGRESS' = 'ALL',
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
        case 'CANCELED':
          status = ApplicationStatus.CANCELED;
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

  async applicationsByUser(userId: string) {
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

  async acceptApplication(
    userId: string,
    applicationId: string,
  ): Promise<{ message: string; data: any }> {
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

      if (!application) throw new NotFoundException('Application not found');

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

      if (application.modId !== userId) {
        throw new ForbiddenException(
          "You can't accept this application, someone else is working on it.",
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

      await this.notificationService.createNotification(
        application.userId,
        'APPLICATION_STATUS_CHANGE',
        `Your application has been accepted, you get more information via email.`,
      );

      if (otherApplications.length > 0) {
        // mapping of promises to delete other applications
        const deletionTasks = otherApplications.map(
          (otherApp) => () => this.deleteApplicationWithDocuments(otherApp), // Funktion die Promise zurückgibt
        );

        // Parallel deletion mit limitierter Concurrency
        await limitConcurrency(5, deletionTasks);
      }

      await this.prisma.user.update({
        where: { id: application.userId },
        data: {
          role: UserRoles.AUTHOR,
          authorizedBy: userId,
          authorizedAt: new Date(),
        },
      });

      await this.mailService.sendApplicationAcceptedEmail(application.email, {
        firstname: application.user!.firstname,
        lastname: application.user!.lastname,
      });

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

  // Hilfsmethode für die Löschung einer Application mit ihren Dokumenten
  private async deleteApplicationWithDocuments(
    application: any,
  ): Promise<void> {
    try {
      // Delete documents if they exist from Cloudinary
      if (application.referenceDocument?.length > 0) {
        const docDeletions = application.referenceDocument
          .filter((doc) => doc.publicId)
          .map((doc) =>
            this.cloudinary.deleteFile(doc.publicId).catch((err) => {
              console.error(
                `Fehler beim Löschen von Dokument ${doc.publicId} (Application ${application.id}):`,
                err,
              );
            }),
          );

        await Promise.all(docDeletions);
      }

      // Delete the application
      await this.prisma.application.delete({
        where: { id: application.id },
      });
    } catch (error) {
      console.error(
        `Error while deleting application with following id: ${application.id}:`,
        error,
      );
    }
  }

  async rejectApplication(
    userId: string,
    applicationId: string,
    dto: RejectionDto,
  ) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Application is not in a state that can be rejected.',
        );
      }

      if (application.modId !== userId) {
        throw new ForbiddenException(
          "You can't reject this application, someone else is working on it.",
        );
      }

      const updatedApplication = await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
          modId: userId,
        },
      });

      if (application.userId !== null) {
        await this.notificationService.createNotification(
          application.userId,
          'APPLICATION_STATUS_CHANGE',
          `Your application has been rejected, you get more information via email`,
        );
      }

      // Send rejection email
      await this.mailService.sendApplicationRejectedEmail(application.email, {
        firstname: application.user!.firstname,
        reason: dto.reason,
      });
      return {
        message: 'Application rejected successfully',
        data: updatedApplication,
      };
    } catch (err) {
      console.error('Error in rejectApplication:', err);
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while rejecting the application. Please try again later.',
        );
      }
    }
  }

  async cancelApplication(userId: string, applicationId: string) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.userId !== userId) {
        throw new ForbiddenException(
          'You can only cancel your own applications.',
        );
      }

      if (
        application.status !== ApplicationStatus.PENDING &&
        application.status !== ApplicationStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'application cannot be canceled, it is not in a state that can be canceled.',
        );
      }

      const updatedApplication = await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.CANCELED,
        },
      });

      return {
        message: 'Application canceled successfully',
        data: updatedApplication,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while canceling the application. Please try again later.',
        );
      }
    }
  }

  async blockUserFromApplication(
    userId: string,
    targetId: string,
    reason: string,
  ) {
    try {
      const target = await this.prisma.user.findUnique({
        where: { id: targetId },
      });

      if (!target) {
        throw new NotFoundException('Target user not found');
      }

      if (target.blockedForApplication) {
        throw new BadRequestException(
          'User is already blocked from sending applications.',
        );
      }

      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          blockedForApplication: true,
          moderatedBy: userId,
          moderatedAt: new Date(),
        },
      });

      const firstname = target.firstname || 'User';

      await this.mailService.sendBlockingFromApplicationEmail(target.email, {
        firstname,
        reason,
      });

      await this.notificationService.createNotification(
        target.id,
        'APPLICATION_STATUS_CHANGE',
        `You have been blocked from sending applications, you get more information via email.`,
      );

      return {
        message: 'User has been blocked from sending applications',
        data: {
          id: target.id,
          firstname: target.firstname,
          lastname: target.lastname,
          email: target.email,
        },
      };
    } catch (err) {
      console.error('Error in blockUserFromApplication:', err);
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while blocking the user from sending applications. Please try again later.',
        );
      }
    }
  }

  async unblockUserFromApplication(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.blockedForApplication) {
        throw new BadRequestException(
          'User is not blocked from sending applications.',
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { blockedForApplication: false },
      });

      await this.mailService.sendUnblockingFromApplicationEmail(
        updatedUser.email,
        {
          firstname: updatedUser.firstname || 'User',
        },
      );

      await this.notificationService.createNotification(
        updatedUser.id,
        'APPLICATION_STATUS_CHANGE',
        `You have been unblocked from sending applications.`,
      );

      return {
        message: 'User has been unblocked from sending applications',
        data: updatedUser,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(
          'An error occurred while unblocking the user. Please try again later.',
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
            lt: new Date(now.getTime() - oneWeek),
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

    for (const query of queries) {
      const applications = await this.prisma.application.findMany({
        where: query.condition,
        include: {
          referenceDocument: true,
        },
      });

      if (applications.length === 0) continue;

      const deletionTasks = applications.map((application) => async () => {
        try {
          // Cloudinary-Dateien löschen (außerhalb der Transaction)
          if (application.referenceDocument?.length > 0) {
            const docDeletions = application.referenceDocument
              .filter((doc) => doc.publicId)
              .map((doc) =>
                this.cloudinary
                  .deleteFile(doc.publicId)
                  .catch((err) =>
                    console.error(
                      `Failed to delete document ${doc.publicId}:`,
                      err,
                    ),
                  ),
              );
            await Promise.all(docDeletions);
          }

          // Datenbank-Löschung in einer Transaction
          await this.prisma.$transaction(async (tx) => {
            // Erst ApplicationDocuments löschen
            await tx.applicationDocument.deleteMany({
              where: {
                applicationId: application.id,
              },
            });

            // Dann Application löschen
            await tx.application.delete({
              where: { id: application.id },
            });
          });

          deletions++;
          console.log(`Successfully deleted application ${application.id}`);
        } catch (err) {
          console.error(`Error deleting application ${application.id}:`, err);
        }
      });
      // nessesary to limit concurrency to avoid overwhelming the database
      await limitConcurrency(5, deletionTasks);
    }

    return {
      message:
        'Cancelled, rejected or orphaned applications have been removed.',
      deletions,
    };
  }
}
