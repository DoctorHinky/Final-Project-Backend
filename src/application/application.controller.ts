import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationService } from './application.service';
import { CreateApplicationDto, RejectionDto } from './dto';
import { getCurrentUser } from 'src/common/decorators';
import { RequiredRoles } from 'src/common/decorators/roles.decorator';
import { ApplicationStatus, UserRoles } from '@prisma/client';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Get('getApplications')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async getApplications(@Query('status') status: ApplicationStatus | 'ALL') {
    return this.applicationService.getApplications(status);
  }

  @Get('getApplicationByUser/:targetId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async getApplicationByUser(@Param('targetId') targetId: string) {
    return this.applicationService.applicationsByUser(targetId);
  }

  @Get('getMyApplications')
  async getMyApplications(@getCurrentUser('id') userId: string) {
    return this.applicationService.applicationsByUser(userId);
  }

  @Post('sendApplication')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resume', maxCount: 1 },
      { name: 'certification', maxCount: 10 },
      { name: 'coverLetter', maxCount: 1 },
      { name: 'other', maxCount: 10 },
    ]),
  )
  async uploadDocuments(
    @UploadedFiles()
    files: {
      resume?: Express.Multer.File[];
      certification?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
      other?: Express.Multer.File[];
    },
    @getCurrentUser('id') userId: string,
    @Body() body: CreateApplicationDto,
  ) {
    return this.applicationService.sendApplication(userId, body, files);
  }

  @Post('takeApplication/:requestId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async takeApplication(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.applicationService.takeApplication(userId, requestId);
  }

  @Post('acceptApplication/:requestId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async acceptApplication(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.applicationService.acceptApplication(userId, requestId);
  }

  @Patch('rejectApplication/:requestId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async rejectApplication(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
    @Body() dto: RejectionDto,
  ) {
    return this.applicationService.rejectApplication(userId, requestId, dto);
  }

  @Patch('blockUser/:targetId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async blockUser(
    @getCurrentUser('id') userId: string,
    @Param('targetId') targetId: string,
    @Body('reason') reason: string,
  ) {
    return this.applicationService.blockUserFromApplication(
      userId,
      targetId,
      reason,
    );
  }

  @Patch('unblockUser/:userId')
  @RequiredRoles(UserRoles.ADMIN, UserRoles.MODERATOR)
  async unblockUser(@Param('userId') userId: string) {
    return this.applicationService.unblockUserFromApplication(userId);
  }

  @Get('cancelApplication/:requestId')
  async cancelApplication(
    @getCurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.applicationService.cancelApplication(userId, requestId);
  }

  @Get('cleanUp')
  async cleanUp() {
    return this.applicationService.cleanupApplications();
  }
}
