import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRoles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { omit } from 'lodash';
import {
  DeleteAccountDto,
  DeleteMyAccountDto,
  UpdateMeDto,
  updatePassword,
  UpdateUserDto,
} from './dto';
import { hashPassword, verifyPassword } from 'src/auth/utils/password.utils';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async getUserById(role: UserRoles, targetId: string) {
    if (!targetId) {
      throw new NotFoundException('no userId given');
    }

    const target: User | null = await this.prisma.user.findUnique({
      where: {
        id: targetId,
        NOT: { isDeleted: true },
      },
    });

    if (!target) {
      throw new NotFoundException('No User with that id');
    }

    if (role === UserRoles.MODERATOR && target.role === UserRoles.ADMIN) {
      throw new UnauthorizedException('You not allowed to call Admin profiles');
    }

    return omit(target, ['hashedRefreshToken', 'password']);
  }

  async getAllUsers(role: UserRoles) {
    if (role === UserRoles.ADMIN) {
      return await this.prisma.user.findMany({
        where: { NOT: { isDeleted: true } },
      });
    } else if (role === UserRoles.MODERATOR) {
      return await this.prisma.user.findMany({
        where: { NOT: { role: UserRoles.ADMIN, isDeleted: true } },
      });
    }
    throw new ForbiddenException('Unauthorized access, request denied');
  }

  async getUserByUserName(userName: string) {
    if (!userName) {
      throw new BadRequestException('No username given');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        username: userName,
        NOT: { isDeleted: true },
        deactivated: false,
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`No user found with username: ${userName}`);
    }

    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('Unexprected error: User not found');
    }

    return omit(user, ['password']);
  }

  async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<{ message: string }> {
    const payload = { sub: userId, email };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_EMAIL_VERIFICATION_SECRET,
      expiresIn: '5m', // 5 minutes
    });

    const hashedToken = await hashPassword(token);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      },
    });
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.mailService.sendEmailVerification(email, { verificationLink }); // In der mail muss der normal token stehen, damit der User ihn in der URL verwenden kann
    console.log(`Verification email sent to ${email}`);
    return { message: 'email for verification has benn sendet' };
  }

  async updateMe(userId: string, updateData: UpdateMeDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.email !== updateData.email && updateData.email) {
        updateData.verified = false;
        await this.sendVerificationEmail(userId, updateData.email);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return await this.getMe(userId);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        const target =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error.meta?.target as string[])?.join(', ') || 'field(s)';
        throw new BadRequestException(
          `User with this ${target} already exists`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant update user');
      } else {
        throw new Error(
          'Unexpected error occurred while updating user UpdateMe',
        );
      }
    }
  }
  // das ist die function für admins und moderator
  async updateUser(
    userId: string,
    targetId: string,
    updateData: UpdateUserDto,
  ) {
    if (userId === targetId) {
      throw new NotFoundException(
        'You cant update your own profile, on this way (system securety)',
      );
    }

    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
    })) as User;

    const target = (await this.prisma.user.findUnique({
      where: { id: targetId, NOT: { isDeleted: true } },
    })) as User;

    if (!user || !target) {
      throw new BadRequestException('Database error, cant fetch needed data');
    }

    if (
      user.role === UserRoles.MODERATOR &&
      (target.role === UserRoles.MODERATOR || target.role === UserRoles.ADMIN)
    ) {
      throw new UnauthorizedException(
        'You not allowed to update profiles of higher roles',
      );
    } else if (
      target.role === UserRoles.ADMIN &&
      user.role === UserRoles.ADMIN &&
      user.createdAt > target.createdAt // higher timestamp = younger user
    ) {
      throw new UnauthorizedException(
        'You can only update admin profiles that are created after you, (system securety)',
      );
    }

    if (updateData.email !== undefined) {
      updateData.verified = false;
    }
    try {
      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          ...updateData,
          moderatedAt: new Date(),
          moderatedBy: userId,
        },
      });

      return await this.getUserById(user.role, targetId);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        const target =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error.meta?.target as string[])?.join(', ') || 'field(s)';
        throw new BadRequestException(
          `User with this ${target} already exists`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant update user');
      } else {
        throw new Error(
          'Unexpected error occurred while updating user UpdateUser',
        );
      }
    }
  }

  async updatePassword(userId: string, dto: updatePassword) {
    if (dto.password === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const match = await verifyPassword(dto.password, user.password);

    if (!match) {
      // wir senden hier keine unauthorized exception, da wir wissen das der User schon eingeloggt sein musste um überhaupt hierher zu kommen
      throw new BadRequestException('Old password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(dto.newPassword) },
    });

    return 'Password updated successfully';
  }

  async getDeletedUsers() {
    try {
      return await this.prisma.user.findMany({
        where: { isDeleted: true },
        include: {
          deletedByUser: {
            select: {
              username: true,
            },
          },
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException(
          'Unknown error, cant fetch deleted users',
        );
      } else {
        throw new Error(
          'Unexpected error occurred while fetching deleted users',
        );
      }
    }
  }

  // mit dieser function können admins moderatoren und admins erstellen
  async createModsAndAdmins(userId: string, targetId: string) {
    try {
      const user = (await this.prisma.user.findUnique({
        where: { id: userId },
      })) as User;

      const target = (await this.prisma.user.findUnique({
        where: { id: targetId, NOT: { isDeleted: true } },
      })) as User;

      if (userId === targetId) {
        throw new NotFoundException(
          'You cant update your own profile, on this way (system securety), also you cant update your own role',
        );
      }

      if (!user || !target) {
        throw new BadRequestException('Database error, cant fetch needed data');
      }

      if (
        target.role === UserRoles.ADMIN &&
        // es muss > sein, denn es wird ja hochgezählt, also jünger = höherer Timestamp
        user.createdAt > target.createdAt
      ) {
        throw new ForbiddenException(
          'You can only create mods and admins that are created after you, (system securety)',
        );
      }
      let role: UserRoles;

      if (target.role === UserRoles.MODERATOR) {
        role = UserRoles.ADMIN;
      } else {
        role = UserRoles.MODERATOR;
      }

      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          role: role,
          moderatedAt: new Date(),
          moderatedBy: userId,
        },
      });

      await this.mailService.sendMakeModsEmail(target.email, {
        username: target.username,
        role: role,
        systemmail: process.env.SYSTEM_EMAIL!,
      });

      return `User with username ${target.username} is now a ${role}`;
    } catch (error) {
      if (error instanceof HttpException) {
        // Bekannte HTTP-Fehler einfach weiterwerfen
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant update user');
      } else {
        throw new Error(
          'Unexpected error occurred while updating user CreateModsAndAdmins',
        );
      }
    }
  }

  async deleteMyAccount(userId: string, dto: DeleteMyAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const match = await verifyPassword(dto.password, user?.password);
    if (!match) {
      throw new BadRequestException('Accesss denied, password is incorrect');
    }
    if (!user) {
      throw new BadRequestException(
        'Unexprected error, cant delete your account database error',
      );
    }
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: dto.deleteReason ? dto.deleteReason : 'No reason given',
        },
      });
      await this.mailService.sendMail(
        user.email,
        `your account has been deleted`,
        `<p>Dear ${user.username},</p>
        <p>Your account has been successfully deleted.</p>
        <p>We keep your data for 30 days, in case you change your mind.</p>
        <p>To restore your account, you have to contact us manually, via email at ${process.env.SYSTEM_EMAIL}.</p>
        <p>Thank you for being a part of our community.</p>
        <p>Best regards,</p>
        <p>Your Team</p>`,
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant delete user');
      } else {
        throw new Error(
          'Unexpected error occurred while deleting user DeleteMyAccount',
        );
      }
    }

    return 'Account deleted successfully';
  }

  async deactivateMyAccount(userId: string) {
    try {
      const user = (await this.prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
      })) as User;

      if (!user) {
        throw new BadRequestException('no user found');
      }

      if (user.deactivated === false) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { deactivated: true },
        });
      } else {
        throw new BadRequestException('your account is already deactivated');
      }
      await this.mailService.sendMail(
        user.email,
        `your account has been deactivated`,
        `<p>Dear ${user.username},</p>
        <p>Your account has been successfully deactivated.</p>
        <p>To reactivate your account, you can do it manually via the settings page.</p>
        <p>As long your account is deactivated, your posts, comments and likes will not be visible to other users.</p>
        <p>If your stays deactivated for more than 6 month, your account will be deleted automatically.</p>`,
      );

      return 'Account deactivated successfully';
    } catch (error) {
      console.error('Error during account deactivation:', error);
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new Error(
          'Unexpected error occurred while deactivating user',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          error,
        );
      }
    }
  }

  async reactivateMyAccount(userId: string) {
    try {
      const user = (await this.prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
      })) as User;

      if (!user) {
        throw new BadRequestException('no user found');
      }

      if (user.deactivated === true) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { deactivated: false },
        });
      } else {
        throw new BadRequestException('your account isnt deactivated');
      }

      return 'Your account is now active again';
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new Error(
        `Unexpected error occurred while activating user: ${(error as Error).message}`,
      );
    }
  }

  async deleteUser(
    userId: string,
    role: UserRoles,
    targetId: string,
    dto: DeleteAccountDto,
  ) {
    if (userId === targetId) {
      throw new BadRequestException(
        'You cant delete your own profile, on this way (system securety)',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const targetUser = (await this.prisma.user.findUnique({
      where: { id: targetId },
    })) as User;

    if (!user) {
      throw new NotFoundException('Cant find user under this id');
    }

    if (!targetUser) {
      throw new NotFoundException('Cant find user under this id');
    }

    if (
      role === UserRoles.MODERATOR &&
      (targetUser.role === UserRoles.ADMIN ||
        targetUser.role === UserRoles.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'You not allowed to delete profiles of higher roles',
      );
    }

    if (
      targetUser.role === UserRoles.ADMIN &&
      role === UserRoles.ADMIN &&
      user.createdAt > targetUser.createdAt
    ) {
      console.log('es wird ausgelöst');
      throw new ForbiddenException({
        message:
          'You can only delete admin profiles that are created after you, (system securety)',
      });
    }

    if (targetUser.isDeleted === true) {
      throw new BadRequestException('User already deleted');
    }

    try {
      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: dto.deleteReason ? dto.deleteReason : 'No reason given',
        },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant delete user');
      } else {
        throw new Error(
          'Unexpected error occurred while deleting user DeleteUser',
        );
      }
    }
  }

  async restoreUser(userId: string, role: UserRoles, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException(
        'How you even reach this endpoint (system securety)',
      );
    }
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new NotFoundException('Cant find user under this id');
    }

    if (targetUser.isDeleted === false) {
      throw new BadRequestException('User already restored');
    }

    if (
      role === UserRoles.MODERATOR &&
      (targetUser.role === UserRoles.ADMIN ||
        targetUser.role === UserRoles.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'You not allowed to restore profiles of higher roles',
      );
    }
    try {
      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
        },
      });

      await this.mailService.sendMail(
        targetUser.email,
        `Your account has been restored`,
        `<p>Dear ${targetUser.username},</p>
        <p>Your account has been successfully restored.</p>
        <p>We are glad to have you back!</p>
        <p>As a reminder, your account was deleted for the following reason: ${targetUser.deleteReason || 'No reason given'}</p>
        <p>You can now log in again and continue using our services.</p>
        <p>If you have any questions, feel free to contact us at ${process.env.SYSTEM_EMAIL}.</p>
        <p>Best regards,</p>
        <p>Your Team</p>`,
      );

      return `User with username ${targetUser.username} is now restored`;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant restore user');
      } else {
        throw new Error(
          'Unexpected error occurred while restoring user RestoreUser',
        );
      }
    }
  }

  async deleteUserForever(userId: string, role: UserRoles, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException(
        'How you even reach this endpoint (system securety)',
      );
    }
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new NotFoundException('Cant find user under this id');
    }

    if (targetUser.isDeleted === false) {
      throw new BadRequestException('User not deleted');
    }

    if (
      role === UserRoles.MODERATOR &&
      (targetUser.role === UserRoles.ADMIN ||
        targetUser.role === UserRoles.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'You not allowed to delete profiles of higher roles',
      );
    }
    try {
      await this.prisma.user.delete({
        where: { id: targetId },
      });
      // es müssen dann noch alle Spuren gelöscht werden, dafür rufen wir aber die Löschfunktionen der anderen Models auf
      return `User with username ${targetUser.username} is now deleted forever`;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new BadRequestException('Unknown error, cant delete user');
      } else {
        throw new Error(
          'Unexpected error occurred while deleting user DeleteUserForever',
        );
      }
    }
  }

  async getPicture() {
    const allPictures = (await this.prisma.user.findMany({
      where: { NOT: { publicid_picture: null } },

      select: {
        publicid_picture: true,
      },
    })) as { publicid_picture: string }[];

    return allPictures.map((picture) => {
      return picture.publicid_picture;
    });
  }
}
