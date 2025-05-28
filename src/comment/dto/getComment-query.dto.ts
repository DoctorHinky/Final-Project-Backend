import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class GetCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['createdAt', 'rating'])
  orderedBy?: 'createdAt' | 'rating' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(['replies', 'comments', 'all'])
  filter: 'replies' | 'comments' | 'all' = 'all';

  @IsOptional()
  @IsEnum(['all', 'deleted', 'notDeleted'])
  status: 'all' | 'deleted' | 'notDeleted' = 'all';

  get sortBy() {
    return {
      [this.orderedBy || 'createdAt']: this.order || 'desc',
    };
  }
}
