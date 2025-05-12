/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error = exception.getResponse();

    let message = 'Unauthorized';

    if (
      typeof error === 'object' &&
      error['message']?.includes('jwt expired')
    ) {
      message = 'you have to login again';
    } else if (
      typeof error === 'object' &&
      error['message']?.includes('invalid token')
    ) {
      message = 'this token is not valid';
    }

    response.status(401).json({
      statusCode: 401,
      error: 'Unauthorized',
      message,
    });
  }
}
