import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { WalletService } from './wallet.service';
import { CreateDepositRequestDto } from './dto/create-deposit-request.dto';
import { AdjustExpDto } from './dto/adjust-exp.dto';
import { ConvertZpToExpDto } from './dto/convert-zp-to-exp.dto';
import { WithdrawUsdtDto } from './dto/withdraw-usdt.dto';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  getWallet(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getWallet(user.uid);
  }

  @Post('deposit')
  createDeposit(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDepositRequestDto,
  ) {
    return this.walletService.createDepositRequest(user.uid, user.email, dto);
  }

  @Post('deposit-usdt')
  depositUsdt(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.depositUsdt(user.uid, user.email);
  }

  @Post('withdraw-usdt')
  withdrawUsdt(@CurrentUser() user: CurrentUserPayload, @Body() dto: WithdrawUsdtDto) {
    return this.walletService.withdrawUsdt(user.uid, dto.zpAmount);
  }

  @Get('deposits')
  listMyDeposits(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.listMyDeposits(user.uid);
  }

  @Get('admin/deposits')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  listAllDeposits() {
    return this.walletService.listAllDeposits();
  }

  @Post('admin/deposits/:id/approve')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  approveDeposit(@Param('id') id: string) {
    return this.walletService.approveDeposit(id);
  }

  @Post('admin/deposits/:id/reject')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  rejectDeposit(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.walletService.rejectDeposit(id, reason);
  }

  @Post('convert-zp-to-exp')
  convertZpToExp(@CurrentUser() user: CurrentUserPayload, @Body() dto: ConvertZpToExpDto) {
    return this.walletService.convertZpToExp(user.uid, dto.amount);
  }

  @Get('admin/members')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  listAllMembers() {
    return this.walletService.listAllMembersAdmin();
  }

  @Get('admin/transactions')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  listTransactions() {
    return this.walletService.listTransactionsAdmin();
  }

  @Post('admin/members/:uid/exp')
  @UseGuards(AdminGuard)
  @RequireAdminLevel(1)
  adjustExp(
    @Param('uid') uid: string,
    @Body() dto: AdjustExpDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.walletService.adjustExp(uid, dto.amount, user.email, dto.reason);
  }
}
