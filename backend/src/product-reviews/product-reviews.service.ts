import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { CreateProductReviewDto } from './dto/create-product-review.dto';

@Injectable()
export class ProductReviewsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_PRODUCT_REVIEWS);
  }

  /** One review per member per product — filtering by productId only (no orderBy) avoids needing a composite index. */
  async listByProduct(productId: string) {
    const snap = await this.col().where('productId', '==', productId).get();
    const reviews = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
      .sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
    const count = reviews.length;
    const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    return { reviews, average, count };
  }

  /** Deterministic doc id (productId_uid) means re-submitting edits the member's existing review instead of spamming duplicates. */
  async upsert(uid: string, email: string, dto: CreateProductReviewDto) {
    const id = `${dto.productId}_${uid}`;
    const ref = this.col().doc(id);
    const existing = await ref.get();
    await ref.set(
      {
        productId: dto.productId,
        userId: uid,
        email,
        rating: dto.rating,
        comment: dto.comment,
        createdAt: existing.exists ? existing.data()!.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { id };
  }

  async deleteMine(uid: string, id: string) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Review not found');
    }
    if (snap.data()!.userId !== uid) {
      throw new ForbiddenException('Not your review');
    }
    await ref.delete();
    return { success: true };
  }
}
