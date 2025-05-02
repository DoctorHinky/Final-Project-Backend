import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL as string,
        },
      },
    });
  }
}
