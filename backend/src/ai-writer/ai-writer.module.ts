import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { CrossPostModule } from '../cross-post/cross-post.module';
import { AiWriterService } from './ai-writer.service';
import { AiWriterController } from './ai-writer.controller';

@Module({
  imports: [AuthModule, PostsModule, CrossPostModule],
  controllers: [AiWriterController],
  providers: [AiWriterService],
  exports: [AiWriterService],
})
export class AiWriterModule {}
