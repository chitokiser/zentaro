import { Inject, Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

const DEFAULT_MIN_REVIEWS = 10;

function primaryRating(externalRatings: Array<{ rating: number; ratingCount: number }> | undefined): {
  rating: number;
  ratingCount: number;
} | null {
  if (!externalRatings || externalRatings.length === 0) return null;
  // MVP: single external source per product, so "primary" is just the first entry.
  return { rating: externalRatings[0].rating, ratingCount: externalRatings[0].ratingCount };
}

/** Bayesian/weighted rating so a 5.0-with-1-review item can't outrank a 4.8-with-10,000-reviews item (spec §26). */
export function computeWeightedRating(rating: number, ratingCount: number, categoryAverage: number, minReviews: number): number {
  const v = ratingCount;
  const m = minReviews;
  return (v / (v + m)) * rating + (m / (v + m)) * categoryAverage;
}

@Injectable()
export class DrinksRankingService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private configRef() {
    return this.db.collection(COLLECTIONS.ZENTARO_DRINKS_RANKING_CONFIG).doc('config');
  }

  async getMinReviews(): Promise<number> {
    const snap = await this.configRef().get();
    const stored = snap.exists ? (snap.data()!.minReviews as number) : undefined;
    return typeof stored === 'number' && stored >= 0 ? stored : DEFAULT_MIN_REVIEWS;
  }

  async updateMinReviews(minReviews: number): Promise<{ minReviews: number }> {
    await this.configRef().set({ minReviews, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await this.recalcAll();
    return { minReviews };
  }

  /** Recomputes weightedRating for every drinks product against its category's average rating. */
  async recalcAll(): Promise<{ updated: number }> {
    const minReviews = await this.getMinReviews();
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCTS).get();
    if (snap.empty) return { updated: 0 };

    const byCategory = new Map<string, { sum: number; count: number }>();
    for (const doc of snap.docs) {
      const data = doc.data();
      const primary = primaryRating(data.externalRatings);
      if (!primary) continue;
      const key = data.category ?? 'unknown';
      const acc = byCategory.get(key) ?? { sum: 0, count: 0 };
      acc.sum += primary.rating;
      acc.count += 1;
      byCategory.set(key, acc);
    }

    let updated = 0;
    const docsArr = snap.docs;
    for (let i = 0; i < docsArr.length; i += 400) {
      const batch = this.db.batch();
      for (const doc of docsArr.slice(i, i + 400)) {
        const data = doc.data();
        const primary = primaryRating(data.externalRatings);
        if (!primary) {
          batch.update(doc.ref, { weightedRating: null });
          continue;
        }
        const key = data.category ?? 'unknown';
        const acc = byCategory.get(key)!;
        const categoryAverage = acc.count > 0 ? acc.sum / acc.count : primary.rating;
        const weighted = computeWeightedRating(primary.rating, primary.ratingCount, categoryAverage, minReviews);
        batch.update(doc.ref, { weightedRating: Math.round(weighted * 100) / 100 });
        updated += 1;
      }
      await batch.commit();
    }
    return { updated };
  }
}
