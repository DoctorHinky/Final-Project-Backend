import { IsString, Length, IsOptional, IsUrl } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @Length(5, 25)
  title: string;

  @IsString()
  @Length(10, 1500)
  content: string;

  @IsOptional()
  @IsUrl()
  image: string;

  @IsOptional()
  @IsString()
  publicId_image: string;
}
