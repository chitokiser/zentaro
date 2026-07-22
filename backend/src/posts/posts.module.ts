import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { WebzineFeedController } from './webzine-feed.controller';

@Module({
  imports: [AuthModule],
  controllers: [PostsController, WebzineFeedController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
