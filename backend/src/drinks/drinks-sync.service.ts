import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { WhiskyEditionAdapter } from './adapters/whisky-edition.adapter';
import { CocktailDbAdapter } from './adapters/cocktaildb.adapter';
import { Beer9Adapter } from './adapters/beer9.adapter';
import { OpenBreweryDbAdapter } from './adapters/open-brewery-db.adapter';
import { WikidataAdapter } from './adapters/wikidata.adapter';
import { WikipediaBotanicalAdapter } from './adapters/wikipedia-botanical.adapter';
import { TastyAdapter } from './adapters/tasty.adapter';
import { DrinksNormalizerService } from './normalizer.service';
import { DrinksDedupeService } from './dedupe.service';
import { DrinksRankingService } from './ranking.service';

export interface SyncResult {
  newRecords: number;
  updatedRecords: number;
  errors: string[];
}

/**
 * Real Tasty tag names (see adapters/tasty.adapter.ts) chosen per ZENTARO product —
 * confirmed live against the actual tags/list response, not guessed. Tasty has no
 * flavor-profile taxonomy (no "smoky"/"citrus"/etc. tags), so pairing is designed
 * around real meal/occasion tags instead: "happy_hour" for the western-style spirits
 * (gin, liqueur, absinthe), and "vietnamese" cuisine for the PHÚC LỘC line, which are
 * traditional Vietnamese rice spirits — a real cuisine-origin pairing, not a fabricated
 * flavor match. ZENTARO OAK BARREL is excluded (it's an aging vessel, not a drink).
 */
const PRODUCT_FOOD_PAIRING_TAGS: Record<string, string[]> = {
  'zentaro-blue': ['happy_hour'],
  'zentaro-origin': ['happy_hour'],
  'zentaro-st': ['happy_hour'],
  'zentaro-an': ['happy_hour'],
  'phuc-loc-loc-tuu': ['vietnamese'],
  'phuc-loc-bach-ngoc-tuu': ['vietnamese'],
  'phuc-loc-tinh-que': ['vietnamese'],
  'phuc-loc-song-que': ['vietnamese'],
  'phuc-loc-giot-thoi-gian': ['vietnamese'],
  'phuc-loc-dan-viet': ['vietnamese'],
};

@Injectable()
export class DrinksSyncService {
  private readonly logger = new Logger(DrinksSyncService.name);

  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly whiskyEdition: WhiskyEditionAdapter,
    private readonly cocktailDb: CocktailDbAdapter,
    private readonly beer9: Beer9Adapter,
    private readonly openBreweryDb: OpenBreweryDbAdapter,
    private readonly wikidata: WikidataAdapter,
    private readonly wikipediaBotanical: WikipediaBotanicalAdapter,
    private readonly tasty: TastyAdapter,
    private readonly normalizer: DrinksNormalizerService,
    private readonly dedupe: DrinksDedupeService,
    private readonly ranking: DrinksRankingService,
  ) {}

  // 03:00 UTC daily, per spec §36.
  @Cron('0 3 * * *')
  async handleCron() {
    await this.checkNow();
  }

  async checkNow(): Promise<{
    whiskyEdition: SyncResult;
    cocktails: SyncResult;
    ingredients: SyncResult;
    botanicals: SyncResult;
  }> {
    const startedAt = FieldValue.serverTimestamp();
    const [whiskyEditionResult, cocktailsResult, ingredientsResult] =
      await Promise.all([
        this.syncWhiskyEdition().catch((err) => this.toFailure(err)),
        this.syncCocktails().catch((err) => this.toFailure(err)),
        this.syncIngredients().catch((err) => this.toFailure(err)),
      ]);
    // Run after syncIngredients (not in the Promise.all above) so that, for the
    // handful of names both sources happen to share (e.g. "Ginger"), this curated
    // real-botanical data always wins over TheCocktailDB's generic ingredient entry.
    const botanicalsResult = await this.syncBotanicals().catch((err) =>
      this.toFailure(err),
    );

    await this.ranking
      .recalcAll()
      .catch((err) => this.logger.error(`Ranking recalc failed: ${err}`));

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'combined',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords:
        whiskyEditionResult.newRecords +
        cocktailsResult.newRecords +
        ingredientsResult.newRecords +
        botanicalsResult.newRecords,
      updatedRecords:
        whiskyEditionResult.updatedRecords +
        cocktailsResult.updatedRecords +
        ingredientsResult.updatedRecords +
        botanicalsResult.updatedRecords,
      errors: [
        ...whiskyEditionResult.errors,
        ...cocktailsResult.errors,
        ...ingredientsResult.errors,
        ...botanicalsResult.errors,
      ],
      detail: {
        whiskyEdition: whiskyEditionResult,
        cocktails: cocktailsResult,
        ingredients: ingredientsResult,
        botanicals: botanicalsResult,
      },
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
    await this.upsertSource(
      'wikipedia-botanicals',
      'https://en.wikipedia.org/',
      'Wikipedia (CC BY-SA 4.0)',
    );

    return {
      whiskyEdition: whiskyEditionResult,
      cocktails: cocktailsResult,
      ingredients: ingredientsResult,
      botanicals: botanicalsResult,
    };
  }

  private toFailure(err: unknown): SyncResult {
    this.logger.error(`Drinks sync task failed: ${err}`);
    return {
      newRecords: 0,
      updatedRecords: 0,
      errors: [String(err instanceof Error ? err.message : err)],
    };
  }

  private async upsertSource(
    sourceName: string,
    sourceUrl: string,
    license: string,
  ) {
    await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc(sourceName)
      .set(
        {
          sourceName,
          sourceUrl,
          license,
          lastSyncedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }

  async getBeer9Status() {
    const doc = await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('beer9')
      .get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * One-time catalog pull, not part of the daily cron — Beer9's free tier is 100
   * requests/month (see Beer9Adapter), so a recurring sync would exhaust the quota
   * in days. Refuses to run again once completed unless `force` is passed, since a
   * second accidental run burns quota for nothing (upserts are idempotent by sku,
   * so re-running only refreshes existing docs — it doesn't add new risk beyond quota cost).
   */
  async syncBeer9Once(
    maxPages: number,
    force: boolean,
  ): Promise<SyncResult & { pagesFetched: number; stoppedReason: string }> {
    const sourceRef = this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('beer9');
    const existing = await sourceRef.get();
    if (existing.exists && existing.data()?.oneTimeSyncCompletedAt && !force) {
      throw new BadRequestException(
        'Beer9 one-time sync already completed. Pass force=true to re-run (this uses more of the monthly quota).',
      );
    }

    const result: SyncResult & { pagesFetched: number; stoppedReason: string } =
      {
        newRecords: 0,
        updatedRecords: 0,
        errors: [],
        pagesFetched: 0,
        stoppedReason: 'not started',
      };

    const startedAt = FieldValue.serverTimestamp();
    try {
      const { items, pagesFetched, stoppedReason } =
        await this.beer9.fetchOnce(maxPages);
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
                zentaroRating: existingProduct.exists
                  ? (existingProduct.data()!.zentaroRating ?? null)
                  : null,
                zentaroRatingCount: existingProduct.exists
                  ? (existingProduct.data()!.zentaroRatingCount ?? 0)
                  : 0,
                isZentaroProduct: existingProduct.exists
                  ? (existingProduct.data()!.isZentaroProduct ?? false)
                  : false,
                createdAt: existingProduct.exists
                  ? existingProduct.data()!.createdAt
                  : FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                lastSyncedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            existingProduct.exists
              ? (result.updatedRecords += 1)
              : (result.newRecords += 1);
          } catch (err) {
            result.errors.push(
              `beer9 item ${item.sku}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
        await batch.commit();
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }

    await this.ranking
      .recalcAll()
      .catch((err) => this.logger.error(`Ranking recalc failed: ${err}`));

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'beer9',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      errors: result.errors,
      detail: {
        pagesFetched: result.pagesFetched,
        stoppedReason: result.stoppedReason,
      },
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

  async getProducersSyncStatus() {
    const doc = await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('producers')
      .get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * One-time combined pull from Open Brewery DB (breweries, mostly US-heavy) and
   * Wikidata (breweries + distilleries, global but sparse field completeness).
   * Not on the daily cron — this is a large bulk import, re-running it wastes
   * Firestore writes for data that rarely changes, so it's guarded the same way
   * as Beer9's one-time sync (refuses to re-run unless force=true).
   */
  async syncProducersOnce(
    maxPagesOpenBreweryDb: number,
    maxItemsPerWikidataType: number,
    force: boolean,
  ): Promise<{
    newRecords: number;
    updatedRecords: number;
    errors: string[];
    openBreweryDbPagesFetched: number;
    openBreweryDbStoppedReason: string;
    wikidataBreweriesFetched: number;
    wikidataDistilleriesFetched: number;
  }> {
    const sourceRef = this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('producers');
    const existing = await sourceRef.get();
    if (existing.exists && existing.data()?.oneTimeSyncCompletedAt && !force) {
      throw new BadRequestException(
        'Producers one-time sync already completed. Pass force=true to re-run.',
      );
    }

    const result = {
      newRecords: 0,
      updatedRecords: 0,
      errors: [] as string[],
      openBreweryDbPagesFetched: 0,
      openBreweryDbStoppedReason: 'not started',
      wikidataBreweriesFetched: 0,
      wikidataDistilleriesFetched: 0,
    };

    const startedAt = FieldValue.serverTimestamp();
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCERS);

    const upsertAll = async (
      normalizedItems: Record<string, unknown>[],
      errorLabel: string,
    ) => {
      for (let i = 0; i < normalizedItems.length; i += 400) {
        const batch = this.db.batch();
        for (const normalized of normalizedItems.slice(i, i + 400)) {
          try {
            const ref = col.doc(normalized.slug as string);
            const existingDoc = await ref.get();
            batch.set(
              ref,
              {
                ...normalized,
                createdAt: existingDoc.exists
                  ? existingDoc.data()!.createdAt
                  : FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                lastSyncedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            existingDoc.exists
              ? (result.updatedRecords += 1)
              : (result.newRecords += 1);
          } catch (err) {
            result.errors.push(
              `${errorLabel} "${normalized.name}": ${err instanceof Error ? err.message : err}`,
            );
          }
        }
        await batch.commit();
      }
    };

    try {
      const { items, pagesFetched, stoppedReason } =
        await this.openBreweryDb.fetchOnce(maxPagesOpenBreweryDb);
      result.openBreweryDbPagesFetched = pagesFetched;
      result.openBreweryDbStoppedReason = stoppedReason;
      await upsertAll(
        items.map((item) =>
          this.normalizer.normalizeOpenBreweryDbProducer(item),
        ),
        'openbrewerydb',
      );
    } catch (err) {
      result.errors.push(
        `openbrewerydb: ${err instanceof Error ? err.message : err}`,
      );
    }

    try {
      const breweries = await this.wikidata.fetchByType(
        'brewery',
        maxItemsPerWikidataType,
      );
      result.wikidataBreweriesFetched = breweries.length;
      await upsertAll(
        breweries.map((item) =>
          this.normalizer.normalizeWikidataProducer(item, 'brewery'),
        ),
        'wikidata-brewery',
      );
    } catch (err) {
      result.errors.push(
        `wikidata-brewery: ${err instanceof Error ? err.message : err}`,
      );
    }

    try {
      const distilleries = await this.wikidata.fetchByType(
        'distillery',
        maxItemsPerWikidataType,
      );
      result.wikidataDistilleriesFetched = distilleries.length;
      await upsertAll(
        distilleries.map((item) =>
          this.normalizer.normalizeWikidataProducer(item, 'distillery'),
        ),
        'wikidata-distillery',
      );
    } catch (err) {
      result.errors.push(
        `wikidata-distillery: ${err instanceof Error ? err.message : err}`,
      );
    }

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'producers',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      errors: result.errors,
      detail: {
        openBreweryDbPagesFetched: result.openBreweryDbPagesFetched,
        openBreweryDbStoppedReason: result.openBreweryDbStoppedReason,
        wikidataBreweriesFetched: result.wikidataBreweriesFetched,
        wikidataDistilleriesFetched: result.wikidataDistilleriesFetched,
      },
    });

    await sourceRef.set(
      {
        sourceName: 'producers',
        sourceUrl: null,
        license: 'Open Brewery DB (free) + Wikidata (CC0)',
        lastSyncedAt: FieldValue.serverTimestamp(),
        oneTimeSyncCompletedAt: FieldValue.serverTimestamp(),
        lastRunNewRecords: result.newRecords,
        lastRunUpdatedRecords: result.updatedRecords,
        lastRunErrorCount: result.errors.length,
      },
      { merge: true },
    );

    return result;
  }

  async getFoodPairingsSyncStatus() {
    const doc = await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('food-pairings')
      .get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * One-time pull of real Tasty recipes for each ZENTARO product, using the
   * curated real tags in PRODUCT_FOOD_PAIRING_TAGS above. Not on the daily
   * cron since Tasty's rate limits aren't confirmed — guarded the same way
   * as Beer9/producers (refuses to re-run unless force=true).
   */
  async syncFoodPairingsOnce(
    recipesPerProduct: number,
    force: boolean,
  ): Promise<SyncResult> {
    const sourceRef = this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES)
      .doc('food-pairings');
    const existing = await sourceRef.get();
    if (existing.exists && existing.data()?.oneTimeSyncCompletedAt && !force) {
      throw new BadRequestException(
        'Food pairings one-time sync already completed. Pass force=true to re-run.',
      );
    }

    const result: SyncResult = { newRecords: 0, updatedRecords: 0, errors: [] };
    const startedAt = FieldValue.serverTimestamp();
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_FOOD_PAIRINGS);

    for (const [productSlug, tags] of Object.entries(
      PRODUCT_FOOD_PAIRING_TAGS,
    )) {
      try {
        const recipes = await this.tasty.fetchRecipesByTags(
          tags,
          recipesPerProduct,
        );
        for (const raw of recipes) {
          try {
            const normalized = this.normalizer.normalizeTastyRecipe(
              raw,
              productSlug,
            );
            const ref = col.doc(`${productSlug}-${normalized.externalId}`);
            const existingDoc = await ref.get();
            await ref.set(
              {
                ...normalized,
                createdAt: existingDoc.exists
                  ? existingDoc.data()!.createdAt
                  : FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                lastSyncedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            existingDoc.exists
              ? (result.updatedRecords += 1)
              : (result.newRecords += 1);
          } catch (err) {
            result.errors.push(
              `food-pairing "${productSlug}" recipe ${raw.id}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
      } catch (err) {
        result.errors.push(
          `food-pairing "${productSlug}": ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS).add({
      source: 'food-pairings',
      startedAt,
      completedAt: FieldValue.serverTimestamp(),
      newRecords: result.newRecords,
      updatedRecords: result.updatedRecords,
      errors: result.errors,
    });

    await sourceRef.set(
      {
        sourceName: 'food-pairings',
        sourceUrl: null,
        license: 'Tasty (BuzzFeed) via RapidAPI',
        lastSyncedAt: FieldValue.serverTimestamp(),
        oneTimeSyncCompletedAt: FieldValue.serverTimestamp(),
        lastRunNewRecords: result.newRecords,
        lastRunUpdatedRecords: result.updatedRecords,
        lastRunErrorCount: result.errors.length,
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
          const normalized =
            this.normalizer.normalizeWhiskyEditionProduct(item);
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
              zentaroRating: existing.exists
                ? (existing.data()!.zentaroRating ?? null)
                : null,
              zentaroRatingCount: existing.exists
                ? (existing.data()!.zentaroRatingCount ?? 0)
                : 0,
              isZentaroProduct: existing.exists
                ? (existing.data()!.isZentaroProduct ?? false)
                : false,
              createdAt: existing.exists
                ? existing.data()!.createdAt
                : FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              lastSyncedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          existing.exists
            ? (result.updatedRecords += 1)
            : (result.newRecords += 1);
        } catch (err) {
          result.errors.push(
            `whisky-edition item ${item.id}: ${err instanceof Error ? err.message : err}`,
          );
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
            {
              ...normalized,
              updatedAt: FieldValue.serverTimestamp(),
              lastSyncedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          result.updatedRecords += 1;
        } catch (err) {
          result.errors.push(
            `cocktail ${item.idDrink}: ${err instanceof Error ? err.message : err}`,
          );
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
          {
            ...normalized,
            updatedAt: FieldValue.serverTimestamp(),
            lastSyncedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        result.updatedRecords += 1;
      } catch (err) {
        result.errors.push(
          `ingredient "${name}": ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return result;
  }

  /**
   * Curated real botanicals (see wikipedia-botanical.adapter.ts) — small (34 items),
   * deterministic, and safe to re-run daily unlike Beer9's rate-limited catalog pull.
   */
  private async syncBotanicals(): Promise<SyncResult> {
    const result: SyncResult = { newRecords: 0, updatedRecords: 0, errors: [] };
    const col = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_INGREDIENTS);
    const entries = await this.wikipediaBotanical.fetchAll();

    for (const { botanical, summary } of entries) {
      try {
        if (!summary) {
          result.errors.push(
            `botanical "${botanical.name}": Wikipedia summary fetch failed`,
          );
          continue;
        }
        const normalized = this.normalizer.normalizeWikipediaBotanical(
          botanical,
          summary,
        );
        const ref = col.doc(normalized.slug);
        const existing = await ref.get();
        await ref.set(
          {
            ...normalized,
            createdAt:
              existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastSyncedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        existing.exists
          ? (result.updatedRecords += 1)
          : (result.newRecords += 1);
      } catch (err) {
        result.errors.push(
          `botanical "${botanical.name}": ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return result;
  }
}
