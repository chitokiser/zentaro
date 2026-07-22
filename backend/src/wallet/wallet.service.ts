import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateDepositRequestDto } from './dto/create-deposit-request.dto';

export interface WalletView {
  ap: number;
  exp: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
}

const DEFAULT_WALLET = {
  exp: 0,
  timeToken: 0,
  jumpToken: 0,
  rewardPoint: 0,
  tickets: [] as string[],
  nfts: [] as string[],
};

@Injectable()
export class WalletService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly blockchain: BlockchainService,
  ) { }

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
      exp: wallet.exp ?? 0,
      timeToken: wallet.timeToken ?? 0,
      jumpToken: wallet.jumpToken ?? 0,
      rewardPoint: wallet.rewardPoint ?? 0,
      tickets: wallet.tickets ?? [],
      nfts: wallet.nfts ?? [],
    };
  }

  /**
   * Returns the user's custodial on-chain wallet address, generating one lazily on
   * first call. The private key is encrypted at rest and never returned here.
   */
  async getOrCreateChainWallet(uid: string): Promise<{ address: string }> {
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    // Generate the candidate keypair outside the transaction (pure/offline), then use
    // a Firestore transaction as a compare-and-swap so two concurrent calls for the
    // same uid can't each create and persist a different wallet.
    const candidate = this.blockchain.createCustodialWallet();
    const encPrivateKey = this.blockchain.encryptPrivateKey(candidate.privateKey);

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef);
      const existing = snap.data()?.chainAddress as string | undefined;
      if (existing) {
        return { address: existing };
      }

      tx.set(
        walletRef,
        {
          chainAddress: candidate.address,
          encPrivateKey,
          chainWalletCreatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { address: candidate.address };
    });
  }

  /**
   * Decrypts the user's custodial private key for signing an on-chain transaction on
   * their behalf. Callers must use the returned key ephemerally (single request) and
   * never log, persist, or return it over the API.
   */
  async getDecryptedPrivateKey(
    uid: string,
  ): Promise<{ address: string; privateKey: string }> {
    const { address } = await this.getOrCreateChainWallet(uid);
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_WALLETS)
      .doc(uid)
      .get();
    const encPrivateKey = snap.data()!.encPrivateKey as string;
    const privateKey = this.blockchain.decryptPrivateKey(encPrivateKey);
    return { address, privateKey };
  }

  async createDepositRequest(
    uid: string,
    email: string,
    dto: CreateDepositRequestDto,
  ): Promise<{ refCode: string }> {
    const refCode = `DEP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const depositRef = this.db.collection(COLLECTIONS.ZENTARO_DEPOSITS).doc();
    await depositRef.set({
      userId: uid,
      email,
      zpAmount: dto.zpAmount,
      depositorName: dto.depositorName,
      currency: dto.currency,
      refCode,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      rejectReason: null,
    });
    return { refCode };
  }

  async listMyDeposits(uid: string) {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_DEPOSITS)
      .where('userId', '==', uid)
      .get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
  }

  async listAllDeposits() {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_DEPOSITS)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async approveDeposit(id: string) {
    const depositRef = this.db.collection(COLLECTIONS.ZENTARO_DEPOSITS).doc(id);

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(depositRef);
      if (!snap.exists) {
        throw new NotFoundException('Deposit request not found');
      }
      const deposit = snap.data()!;
      if (deposit.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }

      const userRef = this.db.collection(COLLECTIONS.USERS).doc(deposit.userId);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      tx.update(depositRef, {
        status: 'approved',
        reviewedAt: FieldValue.serverTimestamp(),
      });

      tx.update(userRef, {
        points: FieldValue.increment(deposit.zpAmount),
      });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: deposit.userId,
        amount: deposit.zpAmount,
        type: 'points_charge',
        description: `ZP 충전 완료 (입금자: ${deposit.depositorName})`,
        depositId: id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { id, status: 'approved' };
    });
  }

  async rejectDeposit(id: string, reason?: string) {
    const depositRef = this.db.collection(COLLECTIONS.ZENTARO_DEPOSITS).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(depositRef);
      if (!snap.exists) {
        throw new NotFoundException('Deposit request not found');
      }
      if (snap.data()!.status !== 'pending') {
        throw new BadRequestException('Already reviewed');
      }
      tx.update(depositRef, {
        status: 'rejected',
        rejectReason: reason ?? null,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      return { id, status: 'rejected' };
    });
  }
}
