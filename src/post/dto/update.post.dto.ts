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
  qiuickDescription?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  publicId_image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction?: number;

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
}
