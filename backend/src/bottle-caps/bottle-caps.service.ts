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
import { SubmitBottleCapClaimDto } from './dto/submit-bottle-cap-claim.dto';

const EXP_PER_ZENTARO_CAP = 10000;

@Injectable()
export class BottleCapsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_BOTTLE_CAP_CLAIMS);
  }

  async submit(uid: string, email: string, dto: SubmitBottleCapClaimDto) {
    if (!dto.sealConfirmed) {
      throw new BadRequestException(
        '병뚜껑에 인지세 봉인스티커 일부가 남아있어야 신청할 수 있습니다.',
      );
    }

    const docRef = await this.col().add({
      userId: uid,
      email,
      isZentaro: dto.isZentaro,
      brand: dto.brand,
      quantity: dto.quantity,
      sealConfirmed: dto.sealConfirmed,
      contactPhone: dto.contactPhone,
      trackingNumber: dto.trackingNumber ?? null,
      note: dto.note ?? null,
      status: 'pending',
      apAmount: null,
      expAmount: null,
      rejectReason: null,
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
    });
    return { id: docRef.id };
  }

  async listMine(uid: string) {
    const snap = await this.col().where('userId', '==', uid).get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
  }

  async listAll() {
    const snap = await this.col().orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async approve(claimId: string, apAmount: number) {
    const claimRef = this.col().doc(claimId);

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(claimRef);
      if (!snap.exists) {
        throw new NotFoundException('Bottle cap claim not found');
      }
      const claim = snap.data()!;
      if (claim.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }

      const userRef = this.db.collection(COLLECTIONS.USERS).doc(claim.userId);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      const expAmount = claim.isZentaro ? EXP_PER_ZENTARO_CAP * claim.quantity : 0;

      tx.update(claimRef, {
        status: 'approved',
        apAmount,
        expAmount,
        reviewedAt: FieldValue.serverTimestamp(),
      });

      if (apAmount > 0) {
        tx.update(userRef, { points: FieldValue.increment(apAmount) });

        const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
        tx.set(txRef, {
          userId: claim.userId,
          amount: apAmount,
          type: 'zentaro_bottle_cap_reward',
          description: `병뚜껑 리워드: ${claim.brand} x${claim.quantity}`,
          claimId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      if (expAmount > 0) {
        const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(claim.userId);
        tx.set(walletRef, { exp: FieldValue.increment(expAmount) }, { merge: true });
      }

      return { id: claimId, apAmount, expAmount };
    });
  }

  async reject(claimId: string, reason?: string) {
    const claimRef = this.col().doc(claimId);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(claimRef);
      if (!snap.exists) {
        throw new NotFoundException('Bottle cap claim not found');
      }
      if (snap.data()!.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }
      tx.update(claimRef, {
        status: 'rejected',
        rejectReason: reason ?? null,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      return { id: claimId };
    });
  }
}
