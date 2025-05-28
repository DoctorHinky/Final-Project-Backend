import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendService {
  constructor(private prisma: PrismaService) {}

  // gets

  async getAllFriendsOfUser(targetId: string) {
    const friends = await this.prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: targetId }, { receiverId: targetId }],
      },
      include: {
        initiator: true,
        receiver: true,
      },
    });

    return {
      message: 'Friends retrieved successfully',
      data: friends.map((friend) => {
        if (friend.initiatorId === targetId) {
          return {
            id: friend.id,
            friendId: friend.receiver.id,
            username: friend.receiver.username,
            profileImage: friend.receiver.profilePicture || null,
          };
        } else {
          return {
            id: friend.id,
            friendId: friend.initiator.id,
            username: friend.initiator.username,
            profileImage: friend.initiator.profilePicture || null,
          };
        }
      }),
    };
  }

  // for user
  async getAllPendingRequests(targetId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: targetId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: true,
      },
    });

    return {
      message: 'Pending requests retrieved successfully',
      data: requests.map((request) => ({
        id: request.id,
        senderId: request.sender.id,
        username: request.sender.username,
        profileImage: request.sender.profilePicture || null,
      })),
    };
  }
  // for mod
  getAllSendetRequests(targetId: string) {
    return this.prisma.friendRequest.findMany({
      where: {
        senderId: targetId,
      },
      include: {
        receiver: true,
      },
    });
  }

  // brauche ich auch noch eine anfrage für alle bestehenden anfragen?

  async sendFriendRequest(userId: string, targetId: string) {
    try {
      if (userId === targetId) {
        throw new BadRequestException('Cannot send friend request to yourself');
      }
      // überprüfen ob user existiert:
      const target = await this.prisma.user.findUnique({
        where: { id: targetId },
      });
      if (!target) {
        throw new NotFoundException(
          'Cannot send friend request to a non-existing user',
        );
      }

      // überprüfen ob freunde sind:
      const friends = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { initiatorId: userId, receiverId: targetId },
            { initiatorId: targetId, receiverId: userId },
          ],
        },
      });
      if (friends) {
        throw new BadRequestException('You are already friends with this user');
      }
      const now = new Date();
      const fiveMins = new Date(now.getTime() - 5 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const incomingRequest = await this.prisma.friendRequest.findFirst({
        where: { senderId: targetId, receiverId: userId },
      });

      const outgoingRequest = await this.prisma.friendRequest.findFirst({
        where: { senderId: userId, receiverId: targetId },
      });
      console.log('incomingRequest', incomingRequest);
      console.log('outgoingRequest', outgoingRequest);

      // Block if rejects
      if (outgoingRequest) {
        if (
          outgoingRequest.status === FriendRequestStatus.REJECTED &&
          outgoingRequest.responsedAt &&
          outgoingRequest.responsedAt >= oneWeekAgo
        ) {
          throw new BadRequestException(
            'You cannot send a friend request, this user has rejected your last request in less than a week',
          );
        }
      }

      // Block if self-cancelled
      if (outgoingRequest) {
        if (
          outgoingRequest.status === FriendRequestStatus.CANCELED &&
          outgoingRequest.responsedAt &&
          outgoingRequest.responsedAt >= fiveMins
        ) {
          throw new BadRequestException(
            'You cannot send a friend request, you have cancelled your last request in less than 5 minutes',
          );
        }
      }

      if (incomingRequest || outgoingRequest) {
        if (
          incomingRequest?.status !== FriendRequestStatus.PENDING &&
          outgoingRequest?.status !== FriendRequestStatus.PENDING
        ) {
          // Update existing request if it is not pending
          await this.prisma.friendRequest.update({
            where: { id: incomingRequest?.id || outgoingRequest?.id },
            data: {
              status: FriendRequestStatus.PENDING,
              responsedAt: null, // Reset response time
            },
          });
          return {
            message: 'Friend request updated successfully',
            data: incomingRequest || outgoingRequest,
          };
        } else {
          throw new BadRequestException(
            'You already have a pending friend request with this user',
          );
        }
      }

      // Create new friend request
      const request = await this.prisma.friendRequest.create({
        data: {
          senderId: userId,
          receiverId: targetId,
          status: FriendRequestStatus.PENDING,
        },
      });

      return {
        message: 'Friend request sent successfully',
        data: request,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err; // Re-throw the BadRequestException
      }
      throw new BadRequestException('Failed to send friend request', {
        cause: err,
        description: 'Unexpected error occurred while sending friend request',
      });
    }
  }
  acceptFriendRequest(userId: string, requestId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const request = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Friend request not found');
      }

      if (request.receiverId !== userId) {
        throw new BadRequestException(
          'You are not the intended recipient of this friend request',
        );
      }

      if (request.status !== FriendRequestStatus.PENDING) {
        throw new BadRequestException(
          'Friend request is not in a pending state',
        );
      }

      const alreadyFriends = await prisma.friendship.findFirst({
        where: {
          OR: [
            { initiatorId: request.senderId, receiverId: request.receiverId },
            { initiatorId: request.receiverId, receiverId: request.senderId },
          ],
        },
      });
      if (alreadyFriends) {
        throw new BadRequestException(
          'You are already friends with this user.',
        );
      }

      // Create friendship
      const friendship = await prisma.friendship.create({
        data: {
          initiatorId: request.senderId,
          receiverId: request.receiverId,
        },
      });

      // we can delete the friend request now, friendship is established
      await prisma.friendRequest.delete({
        where: { id: requestId },
      });

      return {
        message: 'Friend request accepted successfully',
        data: friendship,
      };
    });
  }
  async rejectFriendRequest(userId: string, requestId: string) {
    return await this.prisma.$transaction(async (prisma) => {
      const request = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Friend request not found');
      }

      if (request.receiverId !== userId) {
        throw new BadRequestException(
          'You are not the intended recipient of this friend request',
        );
      }

      if (request.status !== FriendRequestStatus.PENDING) {
        throw new BadRequestException(
          'Friend request is not in a pending state',
        );
      }

      // Update friend request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.REJECTED, responsedAt: new Date() },
      });

      return {
        message: 'Friend request rejected successfully',
      };
    });
  }
  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    } else if (request.senderId !== userId) {
      throw new BadRequestException(
        'You can only cancel friend requests you have sent',
      );
    } else if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException(
        'You can only cancel pending friend requests',
      );
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: FriendRequestStatus.CANCELED,
        responsedAt: new Date(),
      },
    });

    return {
      message: 'Friend request cancelled successfully',
    };
  }

  removeFriend(userId: string, friendshipId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!friendship) {
        throw new NotFoundException('Friendship not found');
      }

      if (
        friendship.initiatorId !== userId &&
        friendship.receiverId !== userId
      ) {
        throw new BadRequestException(
          'You can only remove friendships you are part of',
        );
      }

      // Delete the friendship
      await prisma.friendship.deleteMany({
        where: {
          id: friendshipId,
          OR: [{ initiatorId: userId }, { receiverId: userId }],
        },
      });

      return {
        message: 'Friend removed successfully',
      };
    });
  }
  async isFriendWith(userId: string, targetId: string): Promise<boolean> {
    const isFriend = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: userId, receiverId: targetId },
          { initiatorId: targetId, receiverId: userId },
        ],
      },
    });
    // not good to read
    // return !!isFriend;

    return isFriend !== null;
  }
}
