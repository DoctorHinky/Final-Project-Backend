import {
  Body,
  Controller,
  Get,
  Param,
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
    console.log('files object:', files);

    // Korrigierte Logs - mit return statement oder direkte Ausgabe
    console.log(
      'resumes:',
      files.resume?.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length,
      })),
    );

    console.log(
      'certification:',
      files.certification?.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length,
      })),
    );

    console.log(
      'coverLetter:',
      files.coverLetter?.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length,
      })),
    );

    console.log(
      'other:',
      files.other?.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length,
      })),
    );

    return this.applicationService.sendApplication(userId, body, files);
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
