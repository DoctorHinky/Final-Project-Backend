import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto';
import { getCurrentUser } from 'src/common/decorators';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

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
    console.log('body', body);
    return this.applicationService.sendApplication(userId, body, files);
  }
}
