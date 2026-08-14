import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { WhiskyMarketService } from './whisky-market.service';
import { AddWatchDto } from './dto/add-watch.dto';
import { SetTargetDto } from './dto/set-target.dto';

@Controller('whisky-market')
export class WhiskyMarketController {
  constructor(private readonly whiskyMarket: WhiskyMarketService) {}

  @Get('dashboard')
  dashboard() {
    return this.whiskyMarket.getDashboard();
  }

  @Get('distilleries')
  listDistilleries(@Query('country') country?: string, @Query('q') q?: string) {
    return this.whiskyMarket.listDistilleries({ country, q });
  }

  @Get('auction-houses')
  listAuctionHouses() {
    return this.whiskyMarket.listAuctionHouses();
  }

  @Get('watchlist')
  @UseGuards(JwtAuthGuard)
  listWatchlist(@CurrentUser() user: CurrentUserPayload) {
    return this.whiskyMarket.listWatchlist(user.uid);
  }

  @Post('watchlist')
  @UseGuards(JwtAuthGuard)
  addWatch(@CurrentUser() user: CurrentUserPayload, @Body() dto: AddWatchDto) {
    return this.whiskyMarket.addWatch(user.uid, dto.distillerySlug);
  }

  @Delete('watchlist/:distillerySlug')
  @UseGuards(JwtAuthGuard)
  removeWatch(@CurrentUser() user: CurrentUserPayload, @Param('distillerySlug') distillerySlug: string) {
    return this.whiskyMarket.removeWatch(user.uid, distillerySlug);
  }

  @Get('targets')
  @UseGuards(JwtAuthGuard)
  listTargets(@CurrentUser() user: CurrentUserPayload) {
    return this.whiskyMarket.listTargets(user.uid);
  }

  @Post('targets')
  @UseGuards(JwtAuthGuard)
  setTarget(@CurrentUser() user: CurrentUserPayload, @Body() dto: SetTargetDto) {
    return this.whiskyMarket.setTarget(user.uid, dto.distillerySlug, dto.targetPrice, dto.notificationOn ?? false);
  }

  @Delete('targets/:distillerySlug')
  @UseGuards(JwtAuthGuard)
  removeTarget(@CurrentUser() user: CurrentUserPayload, @Param('distillerySlug') distillerySlug: string) {
    return this.whiskyMarket.removeTarget(user.uid, distillerySlug);
  }

  // Kept below the more specific routes above so Nest doesn't swallow them into :slug.
  @Get('auction-houses/:slug')
  getAuctionHouse(@Param('slug') slug: string) {
    return this.whiskyMarket.getAuctionHouse(slug);
  }

  @Get('distilleries/:slug')
  getDistillery(@Param('slug') slug: string) {
    return this.whiskyMarket.getDistillery(slug);
  }
}
