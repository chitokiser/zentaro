import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { WhiskyEditionAdapter } from './adapters/whisky-edition.adapter';
import { CocktailDbAdapter } from './adapters/cocktaildb.adapter';
import { DrinksNormalizerService } from './normalizer.service';
import { DrinksDedupeService } from './dedupe.service';
import { DrinksRankingService } from './ranking.service';

export interface SyncResult {
  newRecords: number;
  updatedRecords: number;
  errors: string[];
}

@Injectable()
export class DrinksSyncService {
  private readonly logger = new Logger(DrinksSyncService.name);

  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly whiskyEdition: WhiskyEditionAdapter,
    private readonly cocktailDb: CocktailDbAdapter,
    private readonly normalizer: DrinksNormalizerService,
    private readonly dedupe: DrinksDedupeService,
    private readonly ranking: DrinksRankingService,
  ) {}

  // 03:00 UTC daily, per spec §36.
  @Cron('0 3 * * *')
  async handleCron() {
    await this.checkNow();
  }

  async checkNow(): Promise<{ whiskyEdition: SyncResult; cocktails: SyncResult; ingredients: SyncResult }> {
    const startedAt = FieldValue.serverTimestamp();
    const [whiskyEditionResult, cocktailsResult, ingredientsResult] = await Promise.all([
      this.syncWhiskyEdition().catch((err) => this.toFailure(err)),
      this.syncCocktails().catch((err) => this.toFailure(err)),
      this.syncIngredients().catch((err) => this.toFailure(err)),
    ]);

    await this.ranking.recalcAll().catch((err) => this.logger.error(`Ranking recalc failed: ${err}`));

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'combined',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords: whiskyEditionResult.newRecords + cocktailsResult.newRecords + ingredientsResult.newRecords,
      updatedRecords:
        whiskyEditionResult.updatedRecords + cocktailsResult.updatedRecords + ingredientsResult.updatedRecords,
      errors: [...whiskyEditionResult.errors, ...cocktailsResult.errors, ...ingredientsResult.errors],
      detail: { whiskyEdition: whiskyEditionResult, cocktails: cocktailsResult, ingredients: ingredientsResult },
    });

    await this.upsertSource(
      'whisky-edition',
      'https://thewhiskyedition.com/developer',
      'CC-BY-4.0',
    );
    await this.upsertSource(
      'thecocktaildb',
      'https://www.thecocktaildb.com/',
      'TheCocktailDB free API (attribution required)',
    );

    return { whiskyEdition: whiskyEditionResult, cocktails: cocktailsResult, ingredients: ingredientsResult };
  }

  private toFailure(err: unknown): SyncResult {
    this.logger.error(`Drinks sync task failed: ${err}`);
    return { newRecords: 0, updatedRecords: 0, errors: [String(err instanceof Error ? err.message : err)] };
  }

  private async upsertSource(sourceName: string, sourceUrl: string, license: string) {
    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES).doc(sourceName).set(
      { sourceName, sourceUrl, license, lastSyncedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  private async syncWhiskyEdition(): Promise<SyncResult> {
    const result: SyncResult = { newRecords: 0, updatedRecords: 0, errors: [] };
    const raw = await this.whiskyEdition.fetchAll();
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCTS);

    for (let i = 0; i < raw.length; i += 400) {
      const batch = this.db.batch();
      for (const item of raw.slice(i, i + 400)) {
        try {
          const normalized = this.normalizer.normalizeWhiskyEditionProduct(item);
          const mergeCandidateOf = await this.dedupe.findMergeCandidate({
            name: normalized.name,
            producerName: normalized.producerName,
            abv: normalized.abv,
            excludeSource: normalized.source,
          });
          const ref = col.doc(normalized.slug);
          const existing = await ref.get();
          batch.set(
            ref,
            {
              ...normalized,
              mergeCandidateOf,
              zentaroRating: existing.exists ? existing.data()!.zentaroRating ?? null : null,
              zentaroRatingCount: existing.exists ? existing.data()!.zentaroRatingCount ?? 0 : 0,
              isZentaroProduct: existing.exists ? existing.data()!.isZentaroProduct ?? false : false,
              createdAt: existing.exists ? existing.data()!.createdAt : FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              lastSyncedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          existing.exists ? (result.updatedRecords += 1) : (result.newRecords += 1);
        } catch (err) {
          result.errors.push(`whisky-edition item ${item.id}: ${err instanceof Error ? err.message : err}`);
        }
      }
      await batch.commit();
    }
    return result;
  }

  private async syncCocktails(): Promise<SyncResult> {
    const result: SyncResult = { newRecords: 0, updatedRecords: 0, errors: [] };
    const raw = await this.cocktailDb.fetchAllDrinks();
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_COCKTAILS);

    for (let i = 0; i < raw.length; i += 400) {
      const batch = this.db.batch();
      for (const item of raw.slice(i, i + 400)) {
        try {
          const normalized = this.normalizer.normalizeCocktail(item);
          const ref = col.doc(normalized.externalId);
          batch.set(
            ref,
            { ...normalized, updatedAt: FieldValue.serverTimestamp(), lastSyncedAt: FieldValue.serverTimestamp() },
            { merge: true },
          );
          result.updatedRecords += 1;
        } catch (err) {
          result.errors.push(`cocktail ${item.idDrink}: ${err instanceof Error ? err.message : err}`);
        }
      }
      await batch.commit();
    }
    return result;
  }

  private async syncIngredients(): Promise<SyncResult> {
    const result: SyncResult = { newRecords: 0, updatedRecords: 0, errors: [] };
    const names = await this.cocktailDb.fetchIngredientNames();
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_INGREDIENTS);

    for (const name of names) {
      try {
        const detail = await this.cocktailDb.fetchIngredientDetail(name);
        if (!detail) {
          result.errors.push(`ingredient "${name}": no detail returned`);
          continue;
        }
        const normalized = this.normalizer.normalizeIngredient(detail);
        const ref = col.doc(normalized.slug);
        await ref.set(
          { ...normalized, updatedAt: FieldValue.serverTimestamp(), lastSyncedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
        result.updatedRecords += 1;
      } catch (err) {
        result.errors.push(`ingredient "${name}": ${err instanceof Error ? err.message : err}`);
      }
    }
    return result;
  }
}
