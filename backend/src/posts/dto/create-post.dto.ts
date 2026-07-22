import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { WEBZINE_TAGS } from '../../common/webzine-tags';

export class CreatePostDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(10)
  contentHtml: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  titleVi?: string;

  @IsOptional()
  @IsString()
  contentHtmlEn?: string;

  @IsOptional()
  @IsString()
  contentHtmlVi?: string;

  @IsOptional()
  // Raw spaces (common in copy-pasted video file links) aren't valid in a
  // URL — encode them rather than reject an otherwise-valid link.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/ /g, '%20') : value))
  @IsUrl()
  videoUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(WEBZINE_TAGS, { each: true })
  tags: string[];
}
