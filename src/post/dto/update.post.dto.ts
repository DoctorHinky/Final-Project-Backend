/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateMainPostDataDto {
  @IsOptional()
  @IsString()
  @Length(5, 50)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(5, 500)
  quickDescription?: string;

  @IsOptional()
  @IsUrl()
  image?: string | null;

  @IsOptional()
  @IsString()
  publicId_image?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction?: number;

  @IsOptional()
  forKids?: any;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  category?: string;

  @IsOptional()
  @Type(() => Array)
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((tag) => tag.trim())
      : value,
  )
  @Length(2, 50, { each: true })
  tags?: string[];

  @IsOptional()
  published?: string | boolean;
}
