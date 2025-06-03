import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChapterDto } from './create-chapter.dto';
import { CreateQuizDto } from './create-quiz.dto';

export class CreatePost {
  @IsString()
  @Length(5, 50)
  title: string;

  @IsString()
  @Length(5, 500)
  quickDescription: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image: string | null;

  @IsOptional()
  @IsString()
  publicId_image: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction: number;

  @IsOptional()
  forKids?: any;

  @IsString()
  @IsNotEmpty()
  @Length(3, 10)
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  category: string;

  @IsArray()
  @IsString({ each: true })
  @Length(3, 25, { each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  published?: string | boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  publishedAt?: Date;

  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  chapters: ChapterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuizDto)
  quiz: CreateQuizDto;
}
