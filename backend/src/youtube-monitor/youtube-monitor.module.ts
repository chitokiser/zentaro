import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { YoutubeMonitorService } from './youtube-monitor.service';
import { YoutubeMonitorController } from './youtube-monitor.controller';

@Module({
  imports: [AuthModule, PostsModule],
  controllers: [YoutubeMonitorController],
  providers: [YoutubeMonitorService],
  exports: [YoutubeMonitorService],
})
export class YoutubeMonitorModule {}
