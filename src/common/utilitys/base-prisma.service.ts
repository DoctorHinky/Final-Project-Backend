import { Prisma, PrismaClient } from '@prisma/client';

export abstract class BasePrismaService {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getPrisma(
    tx?: PrismaClient | Prisma.TransactionClient,
  ): PrismaClient | Prisma.TransactionClient {
    return tx ?? this.prisma;
  }
}
