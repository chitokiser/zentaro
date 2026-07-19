import { Module } from '@nestjs/common';
import { CrossPostService } from './cross-post.service';

@Module({
  providers: [CrossPostService],
  exports: [CrossPostService],
})
export class CrossPostModule {}
