import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { YoutubeMonitorService } from './youtube-monitor.service';

@Controller('youtube-monitor')
export class YoutubeMonitorController {
  constructor(private readonly youtubeMonitorService: YoutubeMonitorService) {}

  // Manual trigger for testing — the real schedule is the daily @Cron in the service.
  @Post('check-now')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  checkNow() {
    return this.youtubeMonitorService.checkNow();
  }
}
