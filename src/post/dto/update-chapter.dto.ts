import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @Length(5, 25)
  title: string;

  @IsOptional()
  @IsString()
  @Length(10, 150)
  content: string;

  @IsOptional()
  @IsUrl()
  image: string;

  @IsOptional()
  @IsString()
  publicId_image: string;
}
