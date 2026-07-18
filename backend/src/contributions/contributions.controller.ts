import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { ContributionsService } from './contributions.service';
import { SubmitContributionDto } from './dto/submit-contribution.dto';
import {
  ApproveContributionDto,
  RejectContributionDto,
} from './dto/review-contribution.dto';

@Controller('contributions')
@UseGuards(JwtAuthGuard)
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  submit(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitContributionDto,
  ) {
    return this.contributionsService.submit(user.uid, user.email, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.contributionsService.listMine(user.uid);
  }

  @Get()
  @UseGuards(AdminGuard)
  listAll() {
    return this.contributionsService.listAll();
  }

  @Post(':id/approve')
  @UseGuards(AdminGuard)
  approve(@Param('id') id: string, @Body() dto: ApproveContributionDto) {
    return this.contributionsService.approve(id, dto.apAmount);
  }

  @Post(':id/reject')
  @UseGuards(AdminGuard)
  reject(@Param('id') id: string, @Body() dto: RejectContributionDto) {
    return this.contributionsService.reject(id, dto.reason);
  }
}
