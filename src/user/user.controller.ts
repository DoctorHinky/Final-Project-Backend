import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRoles } from '@prisma/client';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { getCurrentUser } from 'src/common/decorators';
import {
  CreateModsAndAdminsDto,
  DeleteAccountDto,
  UpdateMeDto,
  updatePassword,
  UpdateUserDto,
} from './dto';

@Controller('user')

/**
 * @description UserController is responsible for handling user-related requests
 * @route: /user
 */
export class UserController {
  constructor(private userService: UserService) {}

  @Get('getUserById/:userId')
  getUserById(
    @Param('userId') targetId: string,
    @getCurrentUser('role') role: UserRoles,
  ) {
    return this.userService.getUserById(role, targetId);
  }

  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  @Get('getAllUsers')
  getAllUsers(@getCurrentUser('roles') role: UserRoles) {
    return this.userService.getAllUsers(role);
  }

  @Get('getUserByUserName')
  getUserByUserName(@Body('userName') userName: string) {
    return this.userService.getUserByUserName(userName);
  }

  @Get('getMe')
  getMe(@getCurrentUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('updateMe')
  updateMe(@getCurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.userService.updateMe(userId, dto);
  }

  // hier müssen alle update Funktionen rein für Admins und Moderator
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  @Patch('updateUser/:userId')
  updateUser(
    // Current user is der Moderator oder Admin
    @getCurrentUser('id') userId: string,
    @Param('userId') targetId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(userId, targetId, dto);
  }

  @Patch('updatePassword')
  updatePassword(
    @getCurrentUser('id') userId: string,
    @Body() dto: updatePassword,
  ) {
    return this.userService.updatePassword(userId, dto);
  }

  @Patch('createModsAndAdmins/:userId')
  @RequiredRoles(UserRoles.ADMIN)
  createModsAndAdmins(
    @getCurrentUser('id') userId: string,
    @Body() dto: CreateModsAndAdminsDto,
    @Param('userId') targetId: string,
  ) {
    return this.userService.createModsAndAdmins(userId, targetId, dto);
  }

  @Post('applyForAuthor')
  // Current user is der User selbst
  applyForAuthor(@getCurrentUser('id') userId: string) {
    // es muss noch geklärt werden wir der bewerbungsprozess aussieht
    return this.userService.applyForAuthor(userId);
  }

  @Patch('deleteMyAccount')
  deleteMyAccount(
    @getCurrentUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.userService.deleteMyAccount(userId, dto);
  }

  @Patch('deactivateMyAccount')
  deactivateMyAccount(@getCurrentUser('id') userId: string) {
    return this.userService.deactivateMyAccount(userId);
  }

  @Patch('reactivateMyAccount')
  reactivateMyAccount(@getCurrentUser('id') userId: string) {
    return this.userService.reactivateMyAccount(userId);
  }

  @Patch('deleteUser/:userId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  deleteUser(
    @getCurrentUser('id') userId: string,
    @getCurrentUser('roles') role: UserRoles,
    @Param('userId') targetId: string,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.userService.deleteUser(userId, role, targetId, dto);
  }

  @Patch('restoreUser/:userId')
  restoreUser(
    @getCurrentUser('id') userId: string,
    @getCurrentUser('roles') role: UserRoles,
    @Param('userId') targetId: string,
  ) {
    return this.userService.restoreUser(userId, role, targetId);
  }

  @Delete('deleteUserForever/:userId')
  @RequiredRoles(UserRoles.ADMIN)
  deleteUserForever(
    @getCurrentUser('id') userId: string,
    @getCurrentUser('roles') role: UserRoles,
    @Param('userId') targetId: string,
  ) {
    return this.userService.deleteUserForever(userId, role, targetId);
  }
}
