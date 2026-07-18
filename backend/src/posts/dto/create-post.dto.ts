import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { WEBZINE_TAGS } from '../../common/webzine-tags';

export class CreatePostDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(10)
  contentHtml: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(WEBZINE_TAGS, { each: true })
  tags: string[];
}
