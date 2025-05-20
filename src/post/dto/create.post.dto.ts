import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
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
  image: string;

  @IsOptional()
  @IsString()
  publicId_image: string;

  @IsInt()
  @Min(0)
  @Max(18)
  ageRestriction: number;

  @IsArray()
  @IsString({ each: true })
  @Length(3, 25, { each: true })
  tags: string[];

  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  chapters: ChapterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuizDto)
  quiz: CreateQuizDto;
}
