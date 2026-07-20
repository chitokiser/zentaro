import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: CurrentUserPayload, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.uid, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAll(@Query('status') status?: string) {
    return this.ordersService.listAll(status);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  countUnread() {
    return this.ordersService.countUnread();
  }

  @Get('report')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSalesReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.ordersService.getSalesReport(startDate, endDate);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
