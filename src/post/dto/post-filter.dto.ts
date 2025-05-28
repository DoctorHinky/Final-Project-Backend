import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max } from 'class-validator';

export class PostFilterDto {
  @IsOptional()
  @IsString()
  @Max(26)
  username?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(18)
  ageRestriction?: number;

  @IsOptional()
  forKids?: any;
}
