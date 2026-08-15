import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DrinksSyncService } from '../drinks/drinks-sync.service';

/**
 * One-off manual trigger for the same daily sync the 03:00 UTC cron runs
 * (whisky-edition, cocktails, ingredients, botanicals) — used here to populate
 * real botanical data immediately after a deploy instead of waiting for the
 * next cron tick or requiring an admin login for a sync that isn't behind
 * the one-time-quota guards (Beer9/producers/food-pairings are, this isn't).
 */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const sync = app.get(DrinksSyncService);
  const result = await sync.checkNow();
  console.log(JSON.stringify(result, null, 2));
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
