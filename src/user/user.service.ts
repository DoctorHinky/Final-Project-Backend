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
  CreateModsAndAdminsDto,
  DeleteAccountDto,
  UpdateMeDto,
  updatePassword,
  UpdateUserDto,
} from './dto';
import { hashPassword, verifyPassword } from 'src/auth/utils/password.utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
      return await this.prisma.user.findMany({});
    } else if (role === UserRoles.MODERATOR) {
      return await this.prisma.user.findMany({
        where: { NOT: { role: UserRoles.ADMIN } },
      });
    }
    throw new ForbiddenException('Unauthorized access, request denied');
  }

  async getUserByUserName(userName: string) {
    if (!userName) {
      throw new BadRequestException('No username given');
    }

    const user = await this.prisma.user.findUnique({
      where: { username: userName, NOT: { isDeleted: true } },
      select: {
        username: true,
        publishedPosts: true,
        birthdate: true,
        deactivated: true,
      },
    });

    if (!user || user.deactivated === true) {
      throw new NotFoundException('No User with that username');
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

  async updateMe(userId: string, updateData: UpdateMeDto) {
    try {
      if (updateData.email !== undefined) {
        updateData.verified = false;
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
      user.createdAt < target.createdAt
    ) {
      throw new UnauthorizedException(
        'You can only update admin profiles that are created after you, (system securety)',
      );
    }

    if (updateData.email !== undefined) {
      updateData.verified = false;
    }

    // hier ist es nicht möglich andere Mods oder Admins zu erstellen, dafür wird es eine extra function geben

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

  // mit dieser function können admins moderatoren und admins erstellen
  async createModsAndAdmins(
    userId: string,
    targetId: string,
    updateData: CreateModsAndAdminsDto,
  ) {
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
      if (updateData.role === 'MODERATOR') {
        updateData.role = UserRoles.MODERATOR;
      } else if (updateData.role === 'ADMIN') {
        updateData.role = UserRoles.ADMIN;
      } else {
        throw new BadRequestException('Invalid role');
      }

      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          role: updateData.role,
          moderatedAt: new Date(),
          moderatedBy: userId,
        },
      });

      return `User with username ${target.username} is now a ${updateData.role}`;
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

  // wird erstmal pausiert, da wir noch kein Ticket, und Cloudinary haben
  async applyForAuthor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user;
  }

  async deleteMyAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

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

      return 'Account deactivated successfully';
    } catch (error) {
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
}
