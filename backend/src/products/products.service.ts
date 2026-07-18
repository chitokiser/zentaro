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
import { ImportProductDto } from '../cj/dto/import-product.dto';
import { CreateDirectProductDto } from './dto/create-direct-product.dto';

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

  async listAll() {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async importFromCj(dto: ImportProductDto) {
    const docRef = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).add({
      name: dto.name,
      category: dto.category,
      priceAp: dto.priceAp,
      costAp: dto.costAp,
      imageUrl: dto.imageUrl ?? null,
      description: `${dto.name} (CJ Dropshipping · ${dto.cjSellPrice ?? 'n/a'})`,
      cjProductId: dto.cjProductId,
      fulfillmentType: 'dropshipping',
      featured: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  /**
   * Registers a product ZENTARO stocks and ships itself (Zentaro's own
   * spirits + curated world-famous liquors), as opposed to CJ dropshipping.
   */
  async createDirect(dto: CreateDirectProductDto) {
    const docRef = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).add({
      name: dto.name,
      category: dto.category,
      priceAp: dto.priceAp,
      costAp: dto.costAp,
      imageUrl: dto.imageUrl ?? null,
      description: dto.description ?? dto.name,
      fulfillmentType: 'direct',
      featured: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  async remove(productId: string) {
    const ref = this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).doc(productId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Product not found');
    }
    await ref.delete();
    return { id: productId };
  }

  /**
   * Spends AP (the shared aim119 points economy) plus optional EXP (a
   * zentaro-only currency) to buy a product. Only the product's margin
   * (priceAp - costAp) may be covered by EXP — the cost portion must always
   * be paid in AP. Debits users/{uid}.points and logs a shared `transactions`
   * ledger entry for the AP portion only (EXP is zentaro-only, so it isn't
   * written to the shared ledger other aim119 apps read from).
   */
  async purchase(uid: string, productId: string, expToUse = 0) {
    const productRef = this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .doc(productId);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const [productSnap, userSnap, walletSnap] = await Promise.all([
        tx.get(productRef),
        tx.get(userRef),
        tx.get(walletRef),
      ]);

      if (!productSnap.exists) {
        throw new NotFoundException('Product not found');
      }
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      const product = productSnap.data()!;
      const priceAp: number = product.priceAp ?? 0;
      const costAp: number = product.costAp ?? priceAp;
      const margin = Math.max(0, priceAp - costAp);
      const currentPoints: number = userSnap.data()!.points ?? 0;
      const currentExp: number = walletSnap.exists ? (walletSnap.data()!.exp ?? 0) : 0;

      if (expToUse > margin) {
        throw new BadRequestException('상품 마진을 초과하는 EXP는 사용할 수 없습니다.');
      }
      if (expToUse > currentExp) {
        throw new BadRequestException('EXP 잔액이 부족합니다.');
      }

      const apToPay = priceAp - expToUse;
      if (currentPoints < apToPay) {
        throw new BadRequestException('Insufficient AP balance');
      }

      tx.update(userRef, { points: FieldValue.increment(-apToPay) });
      if (expToUse > 0) {
        tx.set(
          walletRef,
          { exp: FieldValue.increment(-expToUse) },
          { merge: true },
        );
      }

      const orderRef = this.db.collection(COLLECTIONS.ZENTARO_ORDERS).doc();
      tx.set(orderRef, {
        userId: uid,
        productId,
        productName: product.name,
        fulfillmentType: product.fulfillmentType ?? 'dropshipping',
        priceAp,
        costAp,
        apPaid: apToPay,
        expPaid: expToUse,
        status: 'paid',
        createdAt: FieldValue.serverTimestamp(),
      });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -apToPay,
        type: 'zentaro_mall_purchase',
        description: `ZENTARO Mall: ${product.name}`,
        orderId: orderRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        orderId: orderRef.id,
        apPaid: apToPay,
        expPaid: expToUse,
        remainingAp: currentPoints - apToPay,
        remainingExp: currentExp - expToUse,
      };
    });
  }
}
