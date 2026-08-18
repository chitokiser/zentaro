import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiWriterService } from '../ai-writer/ai-writer.service';

const CINEMA_SPIRITS_TAG = '🍿 영화와 술';
const SEED_COUNT = 3;

/**
 * One-off seed for the new 🍿 영화와 술 (Cinema & Spirits) webzine category —
 * generates a few real posts through the same guarded AI pipeline used by the
 * daily cron (see AiWriterService.generateOne's cinema-specific prompt branch),
 * so seed content follows the same anti-fabrication rules rather than being
 * hand-written here.
 */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiWriter = app.get(AiWriterService);

  for (let i = 0; i < SEED_COUNT; i++) {
    const result = await aiWriter.generateOne(CINEMA_SPIRITS_TAG);
    console.log(`[${i + 1}/${SEED_COUNT}]`, JSON.stringify(result));
  }

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
