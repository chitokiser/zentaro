import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrinksController } from './drinks.controller';
import { DrinksService } from './drinks.service';
import { DrinksSyncService } from './drinks-sync.service';
import { DrinksNormalizerService } from './normalizer.service';
import { DrinksDedupeService } from './dedupe.service';
import { DrinksRankingService } from './ranking.service';
import { WhiskyEditionAdapter } from './adapters/whisky-edition.adapter';
import { CocktailDbAdapter } from './adapters/cocktaildb.adapter';

@Module({
  imports: [AuthModule],
  controllers: [DrinksController],
  providers: [
    DrinksService,
    DrinksSyncService,
    DrinksNormalizerService,
    DrinksDedupeService,
    DrinksRankingService,
    WhiskyEditionAdapter,
    CocktailDbAdapter,
  ],
  exports: [DrinksService],
})
export class DrinksModule {}
