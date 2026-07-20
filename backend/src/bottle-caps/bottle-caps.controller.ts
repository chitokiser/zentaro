import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { BottleCapsService } from './bottle-caps.service';
import { SubmitBottleCapClaimDto } from './dto/submit-bottle-cap-claim.dto';
import {
  ApproveBottleCapClaimDto,
  RejectBottleCapClaimDto,
} from './dto/review-bottle-cap-claim.dto';

@Controller('bottle-cap-claims')
@UseGuards(JwtAuthGuard)
export class BottleCapsController {
  constructor(private readonly bottleCapsService: BottleCapsService) {}

  @Post()
  submit(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitBottleCapClaimDto,
  ) {
    return this.bottleCapsService.submit(user.uid, user.email, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.bottleCapsService.listMine(user.uid);
  }

  @Get()
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  listAll() {
    return this.bottleCapsService.listAll();
  }

  @Post(':id/approve')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  approve(@Param('id') id: string, @Body() dto: ApproveBottleCapClaimDto) {
    return this.bottleCapsService.approve(id, dto.apAmount);
  }

  @Post(':id/reject')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  reject(@Param('id') id: string, @Body() dto: RejectBottleCapClaimDto) {
    return this.bottleCapsService.reject(id, dto.reason);
  }
}
