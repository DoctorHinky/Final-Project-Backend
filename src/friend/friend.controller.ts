import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FriendService } from './friend.service';
import { getCurrentUser } from 'src/common/decorators';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from '@prisma/client';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('friendsOfMe')
  getFriendsOfMe(@getCurrentUser('id') userId: string) {
    return this.friendService.getAllFriendsOfUser(userId);
  }

  @Get('ofUser/:userId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getFriendsOfUser(@Param('userId') targetId: string) {
    return this.friendService.getAllFriendsOfUser(targetId);
  }

  @Get('pendingRequestsOfMe')
  getAllPendings(@getCurrentUser('id') userId: string) {
    return this.friendService.getAllPendingRequests(userId);
  }

  @Get('requestsOfUser/:targetId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getAllRequestsOfUser(@Param('targetId') targetId: string) {
    return this.friendService.getAllSendetRequests(targetId);
  }

  @Post('sendFriendRequest/:targetId')
  sendFriendRequest(
    @getCurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.friendService.sendFriendRequest(userId, targetId);
  }

  @Post('acceptFriendRequest/:requestId')
  async acceptFriendRequest(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return await this.friendService.acceptFriendRequest(userId, requestId);
  }

  @Patch('rejectFriendRequest/:requestId')
  rejectRequest(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(userId, requestId);
  }

  @Patch('cancelFriendRequest/:requestId')
  cancelFriendRequest(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.cancelFriendRequest(userId, requestId);
  }

  @Patch('removeFriend/:friendshipId')
  removeFriend(
    @getCurrentUser('id') userId: string,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendService.removeFriend(userId, friendshipId);
  }

  @Get('isFriend/:targetId')
  isMyFriend(
    @getCurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.friendService.isFriendWith(userId, targetId);
  }

  @Get('isFriendWith/:user1Id/:user2Id')
  isFriendWith(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string,
  ) {
    return this.friendService.isFriendWith(user1Id, user2Id);
  }
}
