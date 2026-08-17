import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DrinksService } from './drinks.service';
import { DrinksSyncService } from './drinks-sync.service';
import { DrinksRankingService } from './ranking.service';
import { RateProductDto } from './dto/rate-product.dto';
import { UpdateRankingConfigDto } from './dto/update-ranking-config.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';
import { SetZentaroFlagDto } from './dto/set-zentaro-flag.dto';

@Controller()
export class DrinksController {
  constructor(
    private readonly drinksService: DrinksService,
    private readonly drinksSync: DrinksSyncService,
    private readonly ranking: DrinksRankingService,
  ) {}

  @Get('drinks/search')
  search(
    @Query('q') q = '',
    @Query('category') category?: string,
    @Query('country') country?: string,
    @Query('minAbv') minAbv?: string,
    @Query('maxAbv') maxAbv?: string,
  ) {
    return this.drinksService.search(q, {
      category,
      country,
      minAbv: minAbv ? Number(minAbv) : undefined,
      maxAbv: maxAbv ? Number(maxAbv) : undefined,
    });
  }

  @Get('drinks/rankings')
  rankings(
    @Query('tab') tab = 'top-rated',
    @Query('category') category?: string,
  ) {
    return this.drinksService.listRankings(tab, category);
  }

  @Get('drinks/statistics')
  statistics() {
    return this.drinksService.getStatistics();
  }

  @Get('drinks/country/:code')
  byCountry(@Param('code') code: string) {
    return this.drinksService.listByCountry(code);
  }

  // Kept above the /drinks/:slug catch-all below so Nest doesn't swallow these into :slug.
  @Get('drinks/countries')
  listCountries() {
    return this.drinksService.listCountries();
  }

  @Get('drinks/zentaro-originals')
  zentaroOriginals() {
    return this.drinksService.listZentaroOriginals();
  }

  @Get('drinks/food-pairings/:productSlug')
  listFoodPairings(@Param('productSlug') productSlug: string) {
    return this.drinksService.listFoodPairings(productSlug);
  }

  // Kept above the /drinks/cocktails/:id route below so Nest doesn't swallow this into :id.
  @Get('drinks/cocktails/by-ingredient/:name')
  cocktailsByIngredient(@Param('name') name: string) {
    return this.drinksService.findCocktailsByIngredientName(name);
  }

  @Get('drinks/cocktails/:id')
  getCocktail(@Param('id') id: string) {
    return this.drinksService.getCocktailById(id);
  }

  // Kept above the /drinks/:slug catch-all below so Nest doesn't swallow these into :slug.
  @Get('drinks/producers')
  listProducers(
    @Query('type') producerType?: string,
    @Query('country') country?: string,
    @Query('q') q?: string,
  ) {
    return this.drinksService.listProducers({ producerType, country, q });
  }

  @Get('drinks/producers/countries')
  listProducerCountries() {
    return this.drinksService.listProducerCountries();
  }

  @Get('drinks/producers/:slug')
  getProducer(@Param('slug') slug: string) {
    return this.drinksService.getProducerBySlug(slug);
  }

  @Get('botanicals')
  listIngredients(@Query('botanicalOnly') botanicalOnly?: string) {
    return this.drinksService.listIngredients(
      botanicalOnly === 'true' ? true : undefined,
    );
  }

  @Get('botanicals/:slug')
  getIngredient(@Param('slug') slug: string) {
    return this.drinksService.getIngredientBySlug(slug);
  }

  @Post('drinks/:slug/rate')
  @UseGuards(JwtAuthGuard)
  rate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('slug') slug: string,
    @Body() dto: RateProductDto,
  ) {
    return this.drinksService.rateProduct(user.uid, slug, dto.rating);
  }

  // Kept below the more specific /drinks/* routes above so Nest doesn't swallow them into :slug.
  @Get('drinks/:slug')
  getOne(@Param('slug') slug: string) {
    return this.drinksService.getProductBySlug(slug);
  }

  @Post('drinks/admin/:slug/zentaro-flag')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  setZentaroFlag(@Param('slug') slug: string, @Body() dto: SetZentaroFlagDto) {
    return this.drinksService.setZentaroFlagAdmin(slug, dto.isZentaroProduct);
  }

  @Post('drinks/admin/sync-now')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  syncNow() {
    return this.drinksSync.checkNow();
  }

  @Get('drinks/admin/beer9-status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  beer9Status() {
    return this.drinksSync.getBeer9Status();
  }

  @Post('drinks/admin/sync-beer9-once')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  syncBeer9Once(@Body() body: { maxPages?: number; force?: boolean }) {
    return this.drinksSync.syncBeer9Once(
      body.maxPages ?? 80,
      body.force ?? false,
    );
  }

  @Get('drinks/admin/producers-status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  producersStatus() {
    return this.drinksSync.getProducersSyncStatus();
  }

  @Post('drinks/admin/sync-producers-once')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  syncProducersOnce(
    @Body()
    body: {
      maxPagesOpenBreweryDb?: number;
      maxItemsPerWikidataType?: number;
      force?: boolean;
    },
  ) {
    return this.drinksSync.syncProducersOnce(
      body.maxPagesOpenBreweryDb ?? 40,
      body.maxItemsPerWikidataType ?? 2000,
      body.force ?? false,
    );
  }

  @Get('drinks/admin/food-pairings-status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  foodPairingsStatus() {
    return this.drinksSync.getFoodPairingsSyncStatus();
  }

  @Post('drinks/admin/sync-food-pairings-once')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  syncFoodPairingsOnce(
    @Body() body: { recipesPerProduct?: number; force?: boolean },
  ) {
    return this.drinksSync.syncFoodPairingsOnce(
      body.recipesPerProduct ?? 6,
      body.force ?? false,
    );
  }

  @Get('drinks/admin/sync-logs')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  syncLogs() {
    return this.drinksService.listSyncLogs();
  }

  @Get('drinks/admin/merge-candidates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  mergeCandidates() {
    return this.drinksService.listMergeCandidates();
  }

  @Get('drinks/admin/ranking-config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  async getRankingConfig() {
    return { minReviews: await this.ranking.getMinReviews() };
  }

  @Post('drinks/admin/ranking-config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  updateRankingConfig(@Body() dto: UpdateRankingConfigDto) {
    return this.ranking.updateMinReviews(dto.minReviews);
  }

  @Post('drinks/admin/recalculate-rankings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  recalcRankings() {
    return this.ranking.recalcAll();
  }

  @Post('botanicals/admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.drinksService.createIngredientAdmin(dto);
  }

  @Put('botanicals/admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.drinksService.updateIngredientAdmin(id, dto);
  }

  @Delete('botanicals/admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  deleteIngredient(@Param('id') id: string) {
    return this.drinksService.deleteIngredientAdmin(id);
  }
}
