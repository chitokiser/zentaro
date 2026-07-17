import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

@Injectable()
export class ProductsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async getFeatured() {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .where('featured', '==', true)
      .limit(20)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Spends AP (the shared aim119 points economy) to buy a zentaro product.
   * Debits users/{uid}.points and logs a shared `transactions` ledger entry
   * so the purchase shows up alongside every other aim119 app's history.
   */
  async purchaseWithAp(uid: string, productId: string) {
    const productRef = this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .doc(productId);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const [productSnap, userSnap] = await Promise.all([
        tx.get(productRef),
        tx.get(userRef),
      ]);

      if (!productSnap.exists) {
        throw new NotFoundException('Product not found');
      }
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      const product = productSnap.data()!;
      const priceAp: number = product.priceAp ?? 0;
      const currentPoints: number = userSnap.data()!.points ?? 0;

      if (currentPoints < priceAp) {
        throw new BadRequestException('Insufficient AP balance');
      }

      tx.update(userRef, { points: FieldValue.increment(-priceAp) });

      const orderRef = this.db.collection(COLLECTIONS.ZENTARO_ORDERS).doc();
      tx.set(orderRef, {
        userId: uid,
        productId,
        productName: product.name,
        priceAp,
        status: 'paid',
        createdAt: FieldValue.serverTimestamp(),
      });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -priceAp,
        type: 'zentaro_mall_purchase',
        description: `ZENTARO Mall: ${product.name}`,
        orderId: orderRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { orderId: orderRef.id, remainingAp: currentPoints - priceAp };
    });
  }
}
