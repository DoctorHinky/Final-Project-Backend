import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChapterDto {
  @IsOptional()
  @IsString()
  @Length(5, 25)
  title: string;

  @IsString()
  @MinLength(150)
  content: string;

  @IsOptional()
  @IsUrl()
  image: string;

  @IsOptional()
  @IsString()
  publicId_image: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class QuizDto {
  @IsString()
  @Length(5, 25)
  title: string;

  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class QuizQuestionDto {
  @IsString()
  @Length(10, 150)
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];

  @IsOptional()
  @IsString()
  @Length(10, 250)
  explanation: string;
}

export class QuizAnswerDto {
  @IsString()
  @Length(1, 50)
  answer: string;

  @IsBoolean()
  isCorrect: boolean;
}

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
  @Min(3)
  @Max(18)
  ageRestriction: number;

  @IsArray()
  @IsString({ each: true })
  @Length(3, 25, { each: true })
  tags: string[];

  @IsOptional()
  @IsBoolean()
  isPublished: boolean;

  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  chapters: ChapterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDto)
  quiz: QuizDto;
}
