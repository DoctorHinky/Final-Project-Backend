/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let message: string = 'Datei Upload Fehler';

    switch (exception.code) {
      case 'LIMIT_FILE_SIZE':
        message =
          'Data overload: File size exceeds the limit, please choose smaller files.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message =
          'Data overload: Too many files uploaded, please reduce the number of files.';
        break;

      case 'LIMIT_UNEXPECTED_FILE':
        message =
          'Data overload: Unexpected file type, please check the file format.';
        break;
      default:
        break;
    }

    response.status(400).json({
      statusCode: 400,
      message: message,
      error: exception.code,
    });
  }
}
