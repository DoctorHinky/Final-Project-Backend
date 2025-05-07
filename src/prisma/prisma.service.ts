import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
<<<<<<< Updated upstream
  constructor() {
    // the folling line is not a comment, it deacativates the eslint rule but only for the next line
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
=======
  constructor(config: ConfigService) {
>>>>>>> Stashed changes
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }
}
