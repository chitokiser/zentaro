import { IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { WEBZINE_TAGS } from '../../common/webzine-tags';

export class PublishExternalPostDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(10)
  contentHtml: string;

  // Defaults to '📰 ZenTaro 카드뉴스' in the service if omitted — this endpoint exists
  // specifically for external content (e.g. a research-lab AI) that publishes as card news.
  @IsOptional()
  @IsIn(WEBZINE_TAGS)
  tag?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  authorName?: string;
}
