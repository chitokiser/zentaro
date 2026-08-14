import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { WhiskyEditionAdapter } from './adapters/whisky-edition.adapter';
import { CocktailDbAdapter } from './adapters/cocktaildb.adapter';
import { Beer9Adapter } from './adapters/beer9.adapter';
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
    private readonly beer9: Beer9Adapter,
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

  async getBeer9Status() {
    const doc = await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES).doc('beer9').get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * One-time catalog pull, not part of the daily cron — Beer9's free tier is 100
   * requests/month (see Beer9Adapter), so a recurring sync would exhaust the quota
   * in days. Refuses to run again once completed unless `force` is passed, since a
   * second accidental run burns quota for nothing (upserts are idempotent by sku,
   * so re-running only refreshes existing docs — it doesn't add new risk beyond quota cost).
   */
  async syncBeer9Once(maxPages: number, force: boolean): Promise<SyncResult & { pagesFetched: number; stoppedReason: string }> {
    const sourceRef = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES).doc('beer9');
    const existing = await sourceRef.get();
    if (existing.exists && existing.data()?.oneTimeSyncCompletedAt && !force) {
      throw new BadRequestException(
        'Beer9 one-time sync already completed. Pass force=true to re-run (this uses more of the monthly quota).',
      );
    }

    const result: SyncResult & { pagesFetched: number; stoppedReason: string } = {
      newRecords: 0,
      updatedRecords: 0,
      errors: [],
      pagesFetched: 0,
      stoppedReason: 'not started',
    };

    const startedAt = FieldValue.serverTimestamp();
    try {
      const { items, pagesFetched, stoppedReason } = await this.beer9.fetchOnce(maxPages);
      result.pagesFetched = pagesFetched;
      result.stoppedReason = stoppedReason;

      const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCTS);
      for (let i = 0; i < items.length; i += 400) {
        const batch = this.db.batch();
        for (const item of items.slice(i, i + 400)) {
          try {
            const normalized = this.normalizer.normalizeBeer9Product(item);
            const mergeCandidateOf = await this.dedupe.findMergeCandidate({
              name: normalized.name,
              producerName: normalized.producerName,
              abv: normalized.abv,
              excludeSource: normalized.source,
            });
            const ref = col.doc(normalized.slug);
            const existingProduct = await ref.get();
            batch.set(
              ref,
              {
                ...normalized,
                mergeCandidateOf,
                zentaroRating: existingProduct.exists ? existingProduct.data()!.zentaroRating ?? null : null,
                zentaroRatingCount: existingProduct.exists ? existingProduct.data()!.zentaroRatingCount ?? 0 : 0,
                isZentaroProduct: existingProduct.exists ? existingProduct.data()!.isZentaroProduct ?? false : false,
                createdAt: existingProduct.exists ? existingProduct.data()!.createdAt : FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                lastSyncedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            existingProduct.exists ? (result.updatedRecords += 1) : (result.newRecords += 1);
          } catch (err) {
            result.errors.push(`beer9 item ${item.sku}: ${err instanceof Error ? err.message : err}`);
          }
        }
        await batch.commit();
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }

    await this.ranking.recalcAll().catch((err) => this.logger.error(`Ranking recalc failed: ${err}`));

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'beer9',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      errors: result.errors,
      detail: { pagesFetched: result.pagesFetched, stoppedReason: result.stoppedReason },
    });

    await sourceRef.set(
      {
        sourceName: 'beer9',
        sourceUrl: null,
        license: 'RapidAPI Beer9 (subscription required)',
        lastSyncedAt: FieldValue.serverTimestamp(),
        oneTimeSyncCompletedAt: FieldValue.serverTimestamp(),
        lastRunProductsFetched: result.newRecords + result.updatedRecords,
        lastRunPagesFetched: result.pagesFetched,
        lastRunStoppedReason: result.stoppedReason,
      },
      { merge: true },
    );

    return result;
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
