import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateDepositRequestDto } from './dto/create-deposit-request.dto';

/** 1 USDT = 10,000 ZP, matching the site's other USD-pegged conversions. */
const USDT_TO_ZP_RATE = 10000;
/** Ignore on-chain dust below this (avoids sweeping/crediting for a few wei of rounding noise). */
const MIN_USDT_DEPOSIT = 0.01;

export interface WalletView {
  ap: number;
  exp: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
}

// TRANSACTIONS is shared across every aim119 app, so any read here must
// filter to these Zentaro-specific types — otherwise this would leak
// other apps' ledger data into the Zentaro admin dashboard.
const ZENTARO_TRANSACTION_TYPES = [
  'points_charge',
  'admin_exp_adjustment',
  'staking_exp_reward',
  'barrel_order',
  'barrel_delivery_fee',
  'barrel_resale',
  'barrel_resale_fee',
  'barrel_enhancement',
  'barrel_finishing',
  'zentaro_mall_purchase',
  'zentaro_bottle_cap_reward',
  'zentaro_contribution_reward',
  'zp_to_exp_conversion',
  'mentor_referral_reward',
];

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

  /**
   * Fully automatic USDT top-up: checks the member's own custodial wallet (opBNB) for a
   * USDT balance, sweeps the entire balance to the company treasury address, and credits
   * ZP at a fixed 1 USDT = 10,000 ZP rate — no admin approval step, unlike the VND/KRW
   * manual bank-transfer flow. The on-chain sweep is irreversible, so the ZP credit +
   * deposit record are written immediately after it confirms, using the tx hash to keep
   * an auditable link between the on-chain transfer and the off-chain ZP grant.
   */
  async depositUsdt(uid: string, email: string) {
    const { address, privateKey } = await this.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);
    const usdt = this.blockchain.getUsdtContract(signer);

    const balanceWei: bigint = await usdt.balanceOf(address);
    const usdtAmount = Number(ethers.formatUnits(balanceWei, 18));
    if (usdtAmount < MIN_USDT_DEPOSIT) {
      throw new BadRequestException(
        `입금된 USDT가 없습니다. 위 지갑 주소로 USDT(opBNB, BEP-20)를 먼저 전송해주세요.`,
      );
    }

    const treasuryAddress = this.blockchain.getTreasuryAddress();
    const tx = await usdt.transfer(treasuryAddress, balanceWei);
    const receipt = await tx.wait();

    const zpAmount = Math.round(usdtAmount * USDT_TO_ZP_RATE);

    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    await this.db.runTransaction(async (fsTx) => {
      fsTx.update(userRef, { points: FieldValue.increment(zpAmount) });

      const depositRef = this.db.collection(COLLECTIONS.ZENTARO_DEPOSITS).doc();
      fsTx.set(depositRef, {
        userId: uid,
        email,
        zpAmount,
        depositorName: email,
        currency: 'USDT',
        usdtAmount,
        txHash: receipt.hash,
        method: 'onchain_auto',
        refCode: `USDT-${Date.now()}`,
        status: 'approved',
        createdAt: FieldValue.serverTimestamp(),
        reviewedAt: FieldValue.serverTimestamp(),
        rejectReason: null,
      });

      const ledgerRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      fsTx.set(ledgerRef, {
        userId: uid,
        amount: zpAmount,
        type: 'points_charge',
        description: `USDT 자동 충전 (${usdtAmount} USDT, tx: ${receipt.hash})`,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true, usdtAmount, zpCredited: zpAmount, txHash: receipt.hash as string };
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

  /** Converts charged ZP into EXP at a fixed 1:1 rate. */
  async convertZpToExp(uid: string, amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('전환할 ZP는 1 이상의 정수여야 합니다.');
    }
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }
      const currentPoints: number = userSnap.data()?.points ?? 0;
      if (currentPoints < amount) {
        throw new BadRequestException(`ZP 잔액이 부족합니다. (필요: ${amount.toLocaleString()} ZP, 보유: ${currentPoints.toLocaleString()} ZP)`);
      }

      tx.update(userRef, { points: FieldValue.increment(-amount) });
      tx.set(walletRef, { exp: FieldValue.increment(amount) }, { merge: true });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount,
        type: 'zp_to_exp_conversion',
        description: `ZP → EXP 전환 (1:1, ${amount.toLocaleString()} ZP 차감 후 지급)`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { success: true, convertedAmount: amount };
    });
  }

  /**
   * ZENTARO_WALLETS is the source of truth for "is this a Zentaro member" —
   * USERS is shared across every aim119 app, so listing that directly would
   * pull in unrelated accounts from sibling apps.
   */
  async listAllMembersAdmin() {
    const walletsSnap = await this.db.collection(COLLECTIONS.ZENTARO_WALLETS).get();
    const members = await Promise.all(
      walletsSnap.docs.map(async (walletDoc) => {
        const uid = walletDoc.id;
        const walletData = walletDoc.data();
        const userSnap = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
        const userData = userSnap.data();
        return {
          uid,
          email: userData?.email ?? null,
          displayName: userData?.displayName ?? null,
          points: userData?.points ?? 0,
          exp: walletData.exp ?? 0,
          adminLevel: userData?.adminLevel ?? null,
          chainAddress: walletData.chainAddress ?? null,
          createdAt: userData?.createdAt ?? null,
        };
      }),
    );
    return members
      .filter((m) => m.email)
      .sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
  }

  async adjustExp(uid: string, amount: number, adminEmail: string, reason?: string) {
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }
      const walletSnap = await tx.get(walletRef);
      const currentExp = walletSnap.exists ? (walletSnap.data()!.exp ?? 0) : 0;
      const nextExp = currentExp + amount;
      if (nextExp < 0) {
        throw new BadRequestException('차감 후 EXP가 0보다 작을 수 없습니다.');
      }

      tx.set(walletRef, { exp: FieldValue.increment(amount) }, { merge: true });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount,
        type: 'admin_exp_adjustment',
        description: reason
          ? `관리자 EXP 조정 (${adminEmail}): ${reason}`
          : `관리자 EXP 조정 (${adminEmail})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { uid, exp: nextExp };
    });
  }

  /** Full EXP/ZP ledger across every Zentaro earn/spend flow, newest first, for the admin monitor. */
  async listTransactionsAdmin() {
    const snap = await this.db
      .collection(COLLECTIONS.TRANSACTIONS)
      .where('type', 'in', ZENTARO_TRANSACTION_TYPES)
      .get();

    const rows = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
      .sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0))
      .slice(0, 500);

    const uids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    const userSnaps = await Promise.all(
      uids.map((uid) => this.db.collection(COLLECTIONS.USERS).doc(uid).get()),
    );
    const emailByUid = new Map(userSnaps.map((s) => [s.id, s.data()?.email ?? null]));

    return rows.map((r) => ({ ...r, email: emailByUid.get(r.userId) ?? null }));
  }
}
