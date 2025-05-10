import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')

/**
 * @description UserController is responsible for handling user-related requests
 * @route: /user
 */
export class UserController {
  constructor(private userService: UserService) {}

  @Get('getUserById/:userid')
  getUserById() {
    return this.userService.getUserById();
  }

  @Get('getAllUsers')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('getMe')
  getMe() {
    return this.userService.getMe();
  }

  // hier müssen alles update Funktionen rein für Admins, Moderator und User
  @Patch('updateUser')
  updateUser() {
    return this.userService.updateUser();
  }

  @Patch('updatePassword')
  updatePassword() {
    return this.userService.updatePassword();
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
