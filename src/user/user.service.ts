import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRoles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { omit } from 'lodash';
import { UpdateMeDto, updatePassword, UpdateUserDto } from './dto';
import { verifyPassword } from 'src/auth/utils/password.utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(role: UserRoles, targetId: string) {
    if (!targetId) {
      throw new Error('no userId given');
    }

    const target: User | null = await this.prisma.user.findUnique({
      where: {
        id: targetId,
      },
    });

    if (!target) {
      throw new Error('No User with that id');
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
      where: { id: targetId },
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

    try {
      await this.prisma.user.update({
        where: { id: targetId },
        data: {
          ...updateData,
          moderatedAt: new Date(),
          moderatedBy: userId,
        },
      });
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

    if (dto.password !== dto.newPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const match = await verifyPassword(dto.password, user.password);

    if (!match) {
      // wir senden hier keine unauthorized exception, da wir wissen das der User schon eingeloggt sein musste um überhaupt hierher zu kommen
      throw new BadRequestException('Old password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: dto.newPassword },
    });

    return omit(user, ['password']);
  }

  applyForAuthor() {
    return 'applyForAuthor';
  }

  deleteMyAccount() {
    return 'deleteMyAccount';
  }

  deactivateMyAccount() {
    return 'deactivateMyAccount';
  }

  deleteUser() {
    return 'deleteUser';
  }

  restoreUser() {
    return 'restoreUser';
  }
}
