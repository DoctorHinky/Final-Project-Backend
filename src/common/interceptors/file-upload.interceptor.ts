/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
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
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    console.log(body);
    try {
      body.ageRestriction = parseInt(body.ageRestriction);
      body.tags = Array.isArray(body.tags) ? body.tags : [body.tags];

      body.chapters = JSON.parse(body.chapters || '[]');
      body.quiz = JSON.parse(body.quiz || '{}');
    } catch (err) {
      throw new BadRequestException('Parsing Error in body', {
        cause: err,
        description:
          'Invalid JSON format in body, cant parse chapters or quizz',
      });
    }

    return next.handle();
  }
}
