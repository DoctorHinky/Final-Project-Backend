import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRoles } from '@prisma/client';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { getCurrentUser } from 'src/common/decorators';
import {
  DeleteAccountDto,
  DeleteMyAccountDto,
  UpdateMeDto,
  updatePassword,
  UpdateUserDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { memoryStorage } from 'multer';

@Controller('user')

/**
 * @description UserController is responsible for handling user-related requests
 * @route: /user
 */
export class UserController {
  constructor(
    private userService: UserService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get('getUserById/:userId')
  getUserById(
    @Param('userId') targetId: string,
    @getCurrentUser('roles') role: UserRoles,
  ) {
    return this.userService.getUserById(role, targetId);
  }

  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  @Get('getAllUsers')
  getAllUsers(@getCurrentUser('roles') role: UserRoles) {
    return this.userService.getAllUsers(role);
  }

  @Get('getUserByUserName')
  getUserByUserName(@Query('userName') userName: string) {
    return this.userService.getUserByUserName(userName);
  }

  @Get('getMe')
  getMe(@getCurrentUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('updateMe')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
    }),
  )
  async updateMe(
    @getCurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateMeDto,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadFile(
        file,
        'profile_pictures',
      );
      dto.profilePicture = result.secure_url;
      dto.publicid_picture = result.public_id;
    }
    return this.userService.updateMe(userId, dto);
  }

  // hier müssen alle update Funktionen rein für Admins und Moderator
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  @Patch('updateUser/:userId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
    }),
  )
  async updateUser(
    // Current user is der Moderator oder Admin
    @getCurrentUser('id') userId: string,
    @Param('userId') targetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateUserDto,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadFile(
        file,
        'profile_pictures',
      );

      dto.profilePicture = result.secure_url;
      dto.publicid_picture = result.public_id;
    }
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
    @Param('userId') targetId: string,
  ) {
    return this.userService.createModsAndAdmins(userId, targetId);
  }

  @Get('getDeletedUsers')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  getDeletedUsers() {
    return this.userService.getDeletedUsers();
  }

  @Patch('deleteMyAccount')
  deleteMyAccount(
    @getCurrentUser('id') userId: string,
    @Body() dto: DeleteMyAccountDto,
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
