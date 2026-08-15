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
import { Beer9Adapter } from './adapters/beer9.adapter';
import { OpenBreweryDbAdapter } from './adapters/open-brewery-db.adapter';
import { WikidataAdapter } from './adapters/wikidata.adapter';
import { WikipediaBotanicalAdapter } from './adapters/wikipedia-botanical.adapter';
import { TastyAdapter } from './adapters/tasty.adapter';

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
    Beer9Adapter,
    OpenBreweryDbAdapter,
    WikidataAdapter,
    WikipediaBotanicalAdapter,
    TastyAdapter,
  ],
  exports: [DrinksService],
})
export class DrinksModule {}
