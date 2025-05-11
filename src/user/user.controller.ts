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
import { UpdateMeDto, updatePassword, UpdateUserDto } from './dto';

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
  getAllUsers(@getCurrentUser('role') role: UserRoles) {
    return this.userService.getAllUsers(role);
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

  @Post('applyForAuthor')
  applyForAuthor() {
    return this.userService.applyForAuthor();
  }

  @Post('deleteMyAccount')
  deleteMyAccount() {
    return this.userService.deleteMyAccount();
  }

  @Post('deactivateMyAccount')
  deactivateMyAccount() {
    return this.userService.deleteMyAccount();
  }

  @Delete('deleteUser/:userid')
  deleteUser() {
    return this.userService.deleteUser();
  }

  @Post('restoreUser/:userid')
  restoreUser() {
    return this.userService.restoreUser();
  }
}
