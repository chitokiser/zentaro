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
import { SubmitContributionDto } from './dto/submit-contribution.dto';

@Injectable()
export class ContributionsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_CONTRIBUTIONS);
  }

  async submit(uid: string, email: string, dto: SubmitContributionDto) {
    const docRef = await this.col().add({
      userId: uid,
      email,
      itemType: dto.itemType,
      quantity: dto.quantity,
      description: dto.description,
      contactPhone: dto.contactPhone,
      address: dto.address ?? null,
      status: 'pending',
      apAmount: null,
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

  /**
   * Credits AP (the shared aim119 points economy) for an in-kind contribution
   * (오크통/브랜디/위스키/진/럼 실물자산 위탁) once staff assess and price it.
   */
  async approve(contributionId: string, apAmount: number) {
    const contributionRef = this.col().doc(contributionId);

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(contributionRef);
      if (!snap.exists) {
        throw new NotFoundException('Contribution not found');
      }
      const contribution = snap.data()!;
      if (contribution.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }

      const userRef = this.db.collection(COLLECTIONS.USERS).doc(contribution.userId);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      tx.update(contributionRef, {
        status: 'approved',
        apAmount,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      tx.update(userRef, { points: FieldValue.increment(apAmount) });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: contribution.userId,
        amount: apAmount,
        type: 'zentaro_contribution_reward',
        description: `현물출자: ${contribution.itemType} x${contribution.quantity}`,
        contributionId,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { id: contributionId, apAmount };
    });
  }

  async reject(contributionId: string, reason?: string) {
    const contributionRef = this.col().doc(contributionId);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(contributionRef);
      if (!snap.exists) {
        throw new NotFoundException('Contribution not found');
      }
      if (snap.data()!.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }
      tx.update(contributionRef, {
        status: 'rejected',
        rejectReason: reason ?? null,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      return { id: contributionId };
    });
  }
}
