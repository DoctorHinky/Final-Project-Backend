import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
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
  image: string | null;

  @IsOptional()
  @IsString()
  publicId_image: string | null;
}
