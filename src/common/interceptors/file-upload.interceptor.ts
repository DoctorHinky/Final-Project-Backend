/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadGatewayException,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostUploadInterceptor implements NestInterceptor {
  constructor(private readonly CloudinaryService: CloudinaryService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const files: Express.Multer.File[] = request.files;
    console.log('request.body', request.body);
    console.log('request.files', request.files);
    // main picture

    body.ageRestriction = parseInt(body.ageRestriction);
    body.isPublished = body.isPublished === 'true' ? true : false;
    body.tags = Array.isArray(body.tags) ? body.tags : [body.tags];

    const parseChapters = JSON.parse(body.chapters || '[]');
    const parseQuiz = JSON.parse(body.quiz || '{}');

    // main image
    const mainImage = files.find((f) => f.fieldname === 'image');
    if (mainImage) {
      const result = await this.CloudinaryService.uploadFile(
        mainImage,
        'posts/mainImage',
      );

      body.image = result.secure_url;
      body.publicId_image = result.public_id;
    }

    for (let i = 0; i < parseChapters.length; i++) {
      const file = files.find((f) => f.fieldname === `chapterImage_${i}`);
      if (file) {
        const result = await this.CloudinaryService.uploadFile(
          file,
          'posts/chapterImages',
        );

        parseChapters[i].image = result.secure_url;
        parseChapters[i].publicId_image = result.public_id;
      }
    }

    if (body.quiz && typeof body.quiz === 'string') {
      try {
        body.quiz = JSON.parse(body.quiz);
      } catch (err) {
        throw new BadRequestException({
          message: 'Invalid quiz data. Expecting JSON object.',
          error: err,
        });
      }
    }
    body.chapters = parseChapters;
    body.quiz = parseQuiz;

    return next.handle();
  }
}
