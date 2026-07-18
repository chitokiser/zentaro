import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsModule } from '../posts/posts.module';
import { AiWriterService } from './ai-writer.service';
import { AiWriterController } from './ai-writer.controller';

@Module({
  imports: [AuthModule, PostsModule],
  controllers: [AiWriterController],
  providers: [AiWriterService],
})
export class AiWriterModule {}
