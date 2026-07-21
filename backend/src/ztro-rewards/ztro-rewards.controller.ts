import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { ZtroRewardsService } from './ztro-rewards.service';
import { IssueZtroRewardsDto } from './dto/issue-ztro-rewards.dto';
import { RedeemZtroRewardDto } from './dto/redeem-ztro-reward.dto';

@Controller('ztro-rewards')
@UseGuards(JwtAuthGuard)
export class ZtroRewardsController {
  constructor(private readonly ztroRewardsService: ZtroRewardsService) {}

  @Post('redeem')
  redeem(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RedeemZtroRewardDto,
  ) {
    return this.ztroRewardsService.redeem(user.uid, dto.code);
  }

  @Post('issue')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  issue(@Body() dto: IssueZtroRewardsDto) {
    return this.ztroRewardsService.issue(dto.count, dto.baseValue);
  }

  @Get('admin/list')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  listAll() {
    return this.ztroRewardsService.listAll();
  }

  @Get('admin/pool-balance')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  poolBalance() {
    return this.ztroRewardsService.poolBalance();
  }
}
