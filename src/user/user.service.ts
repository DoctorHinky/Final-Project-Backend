import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRoles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { omit } from 'lodash';

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return omit(target, ['hashedRefreshToken', 'password']);
  }

  async getAllUsers(role: UserRoles) {
    if (role === UserRoles.ADMIN) {
      return await this.prisma.user.findMany({});
    } else if (role === UserRoles.MODERATOR) {
      return await this.prisma.user.findMany({
        where: {
          NOT: {
            role: UserRoles.ADMIN,
          },
        },
      });
    }

    throw new ForbiddenException('Unauthorized access, request denied');
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('Unexprected error: User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return omit(user, ['password']);
  }

  updateMe() {
    return 'updateMe';
  }

  updateUser() {
    return 'updateUser';
  }

  updatePassword() {
    return 'updatePassword';
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
