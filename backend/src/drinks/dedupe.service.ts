import { Inject, Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

/**
 * MVP has exactly one product source (WHISKY:EDITION) and one cocktail/ingredient
 * source (TheCocktailDB), so true cross-source duplicates can't occur yet — this
 * exists so a second spirits source (per the spec's §18 future adapters) can be
 * added later without redesigning the pipeline. Priority per §22: name + producer
 * + abv match is the only signal available without barcodes/official product IDs.
 */
@Injectable()
export class DrinksDedupeService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async findMergeCandidate(params: {
    name: string;
    producerName: string | null;
    abv: number | null;
    excludeSource: string;
  }): Promise<string | null> {
    if (!params.producerName) return null;
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCTS)
      .where('producerName', '==', params.producerName)
      .limit(20)
      .get();

    const normalizedName = params.name.trim().toLowerCase();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.source === params.excludeSource) continue;
      const sameName = String(data.name ?? '').trim().toLowerCase() === normalizedName;
      const sameAbv =
        params.abv == null || data.abv == null ? true : Math.abs(Number(data.abv) - params.abv) < 0.1;
      if (sameName && sameAbv) return doc.id;
    }
    return null;
  }
}
