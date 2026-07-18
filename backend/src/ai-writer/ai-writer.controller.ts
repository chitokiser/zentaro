import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AiWriterService } from './ai-writer.service';

@Controller('ai-writer')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AiWriterController {
  constructor(private readonly aiWriterService: AiWriterService) {}

  @Post('generate')
  generate(@Body('tag') tag?: string) {
    return this.aiWriterService.generateOne(tag);
  }
}
