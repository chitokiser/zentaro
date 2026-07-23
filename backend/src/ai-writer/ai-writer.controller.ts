import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { AiWriterService } from './ai-writer.service';

@Controller('ai-writer')
export class AiWriterController {
  constructor(private readonly aiWriterService: AiWriterService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  generate(@Body('tag') tag?: string) {
    return this.aiWriterService.generateOne(tag);
  }

  @Post('generate-promo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  generatePromo(@Body('topicId') topicId?: string) {
    return this.aiWriterService.generateSystemPromoOne(topicId);
  }

  // For external automation tools (Zapier/n8n/etc.) that can't maintain an admin
  // login session — authenticated via a static API key (X-API-Key header) instead.
  @Post('external/generate-promo')
  @UseGuards(ApiKeyGuard)
  generatePromoExternal(@Body('topicId') topicId?: string) {
    return this.aiWriterService.generateSystemPromoOne(topicId);
  }
}
