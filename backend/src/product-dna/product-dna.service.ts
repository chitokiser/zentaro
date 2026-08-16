import { Inject, Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import type { UpdateProductDnaDto } from './dto/update-product-dna.dto';

export interface ProductDnaScores {
  botanical: number;
  sweetness: number;
  aroma: number;
  smoothness: number;
  purity: number;
}

/**
 * Admin-editable overrides for the Spirit DNA scores hardcoded as defaults on
 * ZENTARO's own /about/products page (frontend BRAND_PRODUCTS). Keyed by the
 * static product id used there (e.g. "zentaro-blue"), not a Firestore-generated
 * id, so the frontend can look up an override by the id it already has.
 */
@Injectable()
export class ProductDnaService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_PRODUCT_DNA);
  }

  async getAll(): Promise<Record<string, ProductDnaScores>> {
    const snap = await this.col().get();
    const result: Record<string, ProductDnaScores> = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      result[doc.id] = {
        botanical: data.botanical,
        sweetness: data.sweetness,
        aroma: data.aroma,
        smoothness: data.smoothness,
        purity: data.purity,
      };
    });
    return result;
  }

  async upsert(
    productSlug: string,
    scores: UpdateProductDnaDto,
  ): Promise<ProductDnaScores> {
    await this.col()
      .doc(productSlug)
      .set(
        { ...scores, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    return scores;
  }
}
