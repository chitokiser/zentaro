import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { TokenExchangeService } from './token-exchange.service';
import { BuyZtroDto } from './dto/buy-ztro.dto';
import { AmountDto } from './dto/amount.dto';
import { UpdateBarrelPricingDto } from './dto/update-barrel-pricing.dto';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';

@Controller('token-exchange')
@UseGuards(JwtAuthGuard)
export class TokenExchangeController {
  constructor(private readonly tokenExchangeService: TokenExchangeService) { }

  @Get('dashboard')
  dashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.tokenExchangeService.dashboard(user.uid);
  }

  @Post('buy')
  buy(@CurrentUser() user: CurrentUserPayload, @Body() dto: BuyZtroDto) {
    return this.tokenExchangeService.buy(user.uid, dto.amount, dto.maxPayUsdt);
  }

  @Post('sell')
  sell(@CurrentUser() user: CurrentUserPayload, @Body() dto: AmountDto) {
    return this.tokenExchangeService.sell(user.uid, dto.amount);
  }

  @Post('stake')
  stake(@CurrentUser() user: CurrentUserPayload, @Body() dto: AmountDto) {
    return this.tokenExchangeService.stake(user.uid, dto.amount);
  }

  @Post('unstake')
  unstake(@CurrentUser() user: CurrentUserPayload) {
    return this.tokenExchangeService.unstake(user.uid);
  }

  @Post('claim-dividend')
  claimDividend(@CurrentUser() user: CurrentUserPayload) {
    return this.tokenExchangeService.claimDividend(user.uid);
  }

  @Post('admin/distribute-rewards')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  distributeRewards() {
    return this.tokenExchangeService.distributeWeeklyStakingRewards();
  }

  @Post('barrel/order')
  createBarrelOrder(@CurrentUser() user: CurrentUserPayload, @Body() dto: { size: string }) {
    return this.tokenExchangeService.createBarrelOrder(user.uid, dto.size);
  }

  @Get('barrel/my')
  listMyBarrels(@CurrentUser() user: CurrentUserPayload) {
    return this.tokenExchangeService.listMyBarrels(user.uid);
  }

  @Get('barrel/public')
  listPublicBarrels() {
    return this.tokenExchangeService.listPublicBarrels();
  }

  @Post('barrel/action')
  triggerBarrelAction(@CurrentUser() user: CurrentUserPayload, @Body() dto: { barrelId: string; action: string }) {
    return this.tokenExchangeService.triggerBarrelAction(user.uid, dto.barrelId, dto.action);
  }

  @Post('barrel/:id/list-for-sale')
  listBarrelForSale(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tokenExchangeService.listBarrelForSale(user.uid, id);
  }

  @Post('barrel/:id/cancel-sale')
  cancelBarrelSale(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tokenExchangeService.cancelBarrelSale(user.uid, id);
  }

  @Post('barrel/:id/buy')
  buyBarrel(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tokenExchangeService.buyBarrel(user.uid, id);
  }

  @Delete('admin/barrel/:id')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(2)
  deleteBarrelAdmin(@Param('id') id: string) {
    return this.tokenExchangeService.deleteBarrelAdmin(id);
  }

  @Get('barrel-pricing-config')
  getBarrelPricingConfig() {
    return this.tokenExchangeService.getBarrelPricingConfig();
  }

  @Post('admin/barrel-pricing-config')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  updateBarrelPricingConfig(@Body() dto: UpdateBarrelPricingDto) {
    return this.tokenExchangeService.updateBarrelPricingConfig(dto);
  }
}
