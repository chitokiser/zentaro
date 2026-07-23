import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { AiWriterService } from './ai-writer.service';

@Controller('ai-writer')
@UseGuards(JwtAuthGuard, AdminGuard)
@RequireAdminLevel(2)
export class AiWriterController {
  constructor(private readonly aiWriterService: AiWriterService) {}

  @Post('generate')
  generate(@Body('tag') tag?: string) {
    return this.aiWriterService.generateOne(tag);
  }

  @Post('generate-promo')
  generatePromo(@Body('topicId') topicId?: string) {
    return this.aiWriterService.generateSystemPromoOne(topicId);
  }
}
