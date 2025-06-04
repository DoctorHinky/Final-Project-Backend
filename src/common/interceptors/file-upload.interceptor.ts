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

@Injectable()
export class PostUploadInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    console.log('PostUploadInterceptor called');
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    console.log('context: ', context);
    console.log('body: ', body);
    try {
      body.ageRestriction = parseInt(body.ageRestriction);
      body.tags = Array.isArray(body.tags) ? body.tags : [body.tags];
      console.log('chapters: ', body.chapters);
      console.log('quiz: ', body.quiz);
      body.chapters = JSON.parse(body.chapters || '[]');
      body.quiz = JSON.parse(body.quiz || '{}');

      console.log('parsed body', body);
    } catch (err) {
      console.log('Error parsing body', err);
      throw new BadRequestException('Parsing Error in body', {
        cause: err,
        description:
          'Invalid JSON format in body, cant parse chapters or quizz',
      });
    }

    return next.handle();
  }
}
