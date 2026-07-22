import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service';

/**
 * Public, unauthenticated feed for external consumers (e.g. a script that
 * cross-posts webzine articles to Facebook). Normalizes what /posts returns
 * into a flatter shape (ISO dates, extracted thumbnail, plain-text excerpt)
 * and opens CORS to any origin since this is read-only public content.
 */
@Controller('webzine')
export class WebzineFeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get('feed')
  @Header('Access-Control-Allow-Origin', '*')
  listFeed(@Query('tag') tag?: string) {
    return this.postsService.listFeed(tag);
  }

  @Get('feed/:id')
  @Header('Access-Control-Allow-Origin', '*')
  getFeedItem(@Param('id') id: string) {
    return this.postsService.getFeedItem(id);
  }
}
