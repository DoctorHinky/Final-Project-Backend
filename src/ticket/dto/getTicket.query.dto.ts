import { TicketStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const Status = {
  OPEN: TicketStatus.OPEN,
  IN_PROGRESS: TicketStatus.IN_PROGRESS,
  CLOSED: TicketStatus.CLOSED,
  CANCELED: TicketStatus.CANCELED,
} as const;

export const sortBy = {
  createdAt: 'createdAt', // nach erstellung
  updatedAt: 'updatedAt', // nach zuletzt bearbeitet
} as const;

type Status = (typeof Status)[keyof typeof Status];
type sortBy = (typeof sortBy)[keyof typeof sortBy];

export class GetTicketQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsEnum(sortBy)
  sortBy?: sortBy;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: string;
}
