import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { InvestorWatchService } from './investor-watch.service';
import { CreateWatchDto } from './dto/create-watch.dto';

@Controller('investor-watch')
@UseGuards(JwtAuthGuard, AdminGuard)
@RequireAdminLevel(1)
export class InvestorWatchController {
  constructor(private readonly investorWatch: InvestorWatchService) {}

  @Get()
  listAll() {
    return this.investorWatch.listAll();
  }

  @Post()
  create(@Body() dto: CreateWatchDto) {
    return this.investorWatch.createChecked(dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.investorWatch.delete(id);
  }

  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.investorWatch.acknowledge(id);
  }

  @Get('alerts/count')
  alertCount() {
    return this.investorWatch.activeAlertCount();
  }
}
