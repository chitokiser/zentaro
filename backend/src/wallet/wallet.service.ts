import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

export interface WalletView {
  ap: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
}

const DEFAULT_WALLET = {
  timeToken: 0,
  jumpToken: 0,
  rewardPoint: 0,
  tickets: [] as string[],
  nfts: [] as string[],
};

@Injectable()
export class WalletService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async getWallet(uid: string): Promise<WalletView> {
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    const [userSnap, walletSnap] = await Promise.all([
      userRef.get(),
      walletRef.get(),
    ]);

    if (!userSnap.exists) {
      throw new NotFoundException('User not found');
    }

    if (!walletSnap.exists) {
      await walletRef.set({
        ...DEFAULT_WALLET,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const wallet = walletSnap.exists ? walletSnap.data()! : DEFAULT_WALLET;
    const user = userSnap.data()!;

    return {
      ap: user.points ?? 0,
      timeToken: wallet.timeToken ?? 0,
      jumpToken: wallet.jumpToken ?? 0,
      rewardPoint: wallet.rewardPoint ?? 0,
      tickets: wallet.tickets ?? [],
      nfts: wallet.nfts ?? [],
    };
  }
}
