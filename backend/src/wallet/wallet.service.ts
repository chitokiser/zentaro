import { Inject, Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';
import * as bcrypt from 'bcryptjs';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateDepositRequestDto } from './dto/create-deposit-request.dto';

/**
 * Fallback USD/VND rate used only if the live exchange-rate API is unreachable, so
 * charging/withdrawal never hard-fails on an outage. Deposits/withdrawals otherwise use
 * fetchUsdVndRate() below. This is unrelated to product pricing (priceAp), which stays
 * fixed at 1 ZP = 1 VND regardless of live rate movement — see ztaro-pricing.service.ts.
 */
const FALLBACK_USD_VND_RATE = 26300;
/** Free, no-key exchange-rate API; refreshed on every deposit/withdrawal call. */
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';
/** Ignore on-chain dust below this (avoids sweeping/crediting for a few wei of rounding noise). */
const MIN_USDT_DEPOSIT = 0.01;
/** Platform fee withheld on every ZP -> USDT withdrawal. */
const USDT_WITHDRAWAL_FEE_RATE = 0.03;
/**
 * Platform fee withheld on every member-to-member ZP transfer — same rate as the USDT
 * withdrawal fee, so P2P transfer can't become a free way to consolidate ZP across
 * multiple accounts (e.g. farming per-account referral/charge bonuses, then moving the
 * principal back for free). The fee amount is simply not credited anywhere.
 */
const ZP_P2P_TRANSFER_FEE_RATE = 0.03;
/** Minimum amount per P2P ZP transfer, to keep it from being used for dust spam. */
const MIN_ZP_P2P_TRANSFER = 1000;

export interface WalletView {
  ap: number;
  exp: number;
  level: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
  daoStakingAddress: string | null;
}

// TRANSACTIONS is shared across every aim119 app, so any read here must
// filter to these Zentaro-specific types — otherwise this would leak
// other apps' ledger data into the Zentaro admin dashboard.
const ZENTARO_TRANSACTION_TYPES = [
  'points_charge',
  'admin_exp_adjustment',
  'staking_exp_reward',
  'dao_staking_exp_reward',
  'dao_staking_lockin_bonus',
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
  'usdt_withdrawal',
  'exp_level_up',
  'referral_signup_reward',
  'level_charge_exp_bonus',
  'mentor_level_bonus_reward',
  'zp_p2p_transfer_out',
  'zp_p2p_transfer_in',
];

/** Level-up cost formula: currentLevel^2 * 10000 EXP, deducted on level-up. */
const LEVEL_UP_EXP_MULTIPLIER = 10000;
/** Maximum level a member can reach. */
const MAX_LEVEL = 10;

function expCostForLevel(level: number): number {
  return level * level * LEVEL_UP_EXP_MULTIPLIER;
}

/** Shared by the weekly DAO staking dividend and the one-time lock-in bonus below. */
const DAO_STAKING_SECONDS_PER_MONTH = 30 * 24 * 60 * 60;
const DAO_STAKING_MIN_ACTIVE_STAKE = 10000;

function daoStakingLockMonths(lockedUntil: number, createdAt: number): number {
  return Math.max(1, Math.round((lockedUntil - createdAt) / DAO_STAKING_SECONDS_PER_MONTH));
}

const DEFAULT_WALLET = {
  exp: 0,
  level: 1,
  timeToken: 0,
  jumpToken: 0,
  rewardPoint: 0,
  tickets: [] as string[],
  nfts: [] as string[],
  daoStakingAddress: null as string | null,
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
      level: wallet.level ?? 1,
      timeToken: wallet.timeToken ?? 0,
      jumpToken: wallet.jumpToken ?? 0,
      rewardPoint: wallet.rewardPoint ?? 0,
      tickets: wallet.tickets ?? [],
      nfts: wallet.nfts ?? [],
      daoStakingAddress: wallet.daoStakingAddress ?? null,
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

  /** Canonical message a user signs to prove control of an external wallet before it's linked. */
  daoStakingLinkMessage(uid: string): string {
    return `Link this wallet to ZenTaro DAO staking rewards for account ${uid}`;
  }

  /**
   * Links an external (MetaMask) wallet address to this account for the DAO staking
   * weekly EXP reward — proven via a signed message so one member can't claim credit
   * for tokens someone else staked. One address can only ever be linked to one uid.
   */
  async linkDaoStakingAddress(uid: string, address: string, signature: string) {
    const message = this.daoStakingLinkMessage(uid);
    let recovered: string;
    try {
      recovered = ethers.verifyMessage(message, signature);
    } catch {
      throw new BadRequestException('서명이 유효하지 않습니다.');
    }
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new BadRequestException('서명이 해당 지갑 주소와 일치하지 않습니다.');
    }

    const existing = await this.db
      .collection(COLLECTIONS.ZENTARO_WALLETS)
      .where('daoStakingAddress', '==', address)
      .get();
    if (existing.docs.some((doc) => doc.id !== uid)) {
      throw new ConflictException('이미 다른 계정에 연동된 지갑 주소입니다.');
    }

    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    await walletRef.set({ daoStakingAddress: address }, { merge: true });
    return { address };
  }

  /**
   * The on-chain ZtaroVaultDAO proposal struct has no free-text field for "what is this
   * withdrawal for", and adding one would mean redeploying the (non-upgradeable) vault
   * contract. Stored off-chain instead, keyed by the on-chain proposalId, purely for
   * display alongside the proposal list read straight from the contract.
   */
  async listDaoProposalNotes(): Promise<Array<{ proposalId: number; purpose: string }>> {
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_DAO_PROPOSAL_NOTES).get();
    return snap.docs.map((d) => ({ proposalId: d.data().proposalId, purpose: d.data().purpose }));
  }

  async setDaoProposalNote(proposalId: number, purpose: string, adminEmail: string) {
    const ref = this.db.collection(COLLECTIONS.ZENTARO_DAO_PROPOSAL_NOTES).doc(String(proposalId));
    await ref.set(
      {
        proposalId,
        purpose,
        updatedBy: adminEmail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { proposalId, purpose };
  }

  /** Stake IDs this member has already claimed a one-time lock-in bonus for. */
  async listDaoStakingBonusClaims(uid: string): Promise<number[]> {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_DAO_STAKE_BONUS_CLAIMS)
      .where('userId', '==', uid)
      .get();
    return snap.docs.map((d) => d.data().stakeId as number);
  }

  /**
   * One-time EXP bonus paid the moment a member commits to a lock period, rewarding the
   * choice itself rather than making them wait for the first weekly dividend
   * (distributeDaoStakingExpRewards above). Same formula as the weekly reward — staked
   * amount x level x locked months / 1,000 — but paid once per stakeId, on demand, as
   * soon as the on-chain stake is visible. Ownership is verified via getAllStakes(address)
   * since the vault's stakes() read doesn't expose an owner field directly.
   */
  async claimDaoStakingLockInBonus(uid: string, stakeId: number) {
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const walletSnap = await walletRef.get();
    const walletData = walletSnap.data();
    const address = walletData?.daoStakingAddress as string | undefined;
    if (!address) {
      throw new BadRequestException('DAO 스테이킹 EXP 리워드 연동이 먼저 필요합니다.');
    }

    const claimRef = this.db
      .collection(COLLECTIONS.ZENTARO_DAO_STAKE_BONUS_CLAIMS)
      .doc(`${uid}_${stakeId}`);
    if ((await claimRef.get()).exists) {
      throw new ConflictException('이미 보너스를 수령한 스테이킹입니다.');
    }

    const vault = this.blockchain.getVaultContract(this.blockchain.getProvider());
    const stakeIds: bigint[] = await vault.getAllStakes(address);
    if (!stakeIds.some((id) => Number(id) === stakeId)) {
      throw new BadRequestException('연동된 지갑 소유의 스테이킹이 아닙니다.');
    }

    const s = await vault.stakes(stakeId);
    if (!s.active) {
      throw new BadRequestException('활성 상태의 스테이킹만 보너스를 받을 수 있습니다.');
    }

    const amount = Number(s.amount);
    const level: number = walletData?.level ?? 1;
    const months = daoStakingLockMonths(Number(s.lockedUntil), Number(s.createdAt));
    const bonus = Math.floor((amount * level * months) / 1000);
    if (bonus <= 0) {
      throw new BadRequestException('보너스로 지급할 EXP가 없습니다.');
    }

    await this.db.runTransaction(async (tx) => {
      // Re-check inside the transaction to close the race between the exists-check above
      // and this write (two rapid clicks / requests for the same stake).
      const claimSnap = await tx.get(claimRef);
      if (claimSnap.exists) {
        throw new ConflictException('이미 보너스를 수령한 스테이킹입니다.');
      }
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(walletRef, { exp: FieldValue.increment(bonus) }, { merge: true });
      tx.set(claimRef, {
        userId: uid,
        stakeId,
        amount,
        level,
        months,
        bonus,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(txRef, {
        userId: uid,
        amount: bonus,
        type: 'dao_staking_lockin_bonus',
        description: `Ztaro DAO 스테이킹 락업 확정 보너스 (스테이킹 #${stakeId}, ${amount.toLocaleString()} Ztaro × Lv.${level} × ${months}개월 → +${bonus.toLocaleString()} EXP)`,
        stakeId,
        stakedAmount: amount,
        level,
        months,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { stakeId, bonus, months, level };
  }

  /**
   * Live USD/VND rate (1 ZP = 1 VND, so this doubles as the USD/ZP rate). Queried fresh on
   * every deposit/withdrawal so charging tracks the real market rate instead of drifting
   * from a stale constant. Falls back to FALLBACK_USD_VND_RATE if the API is down, so
   * money movement never blocks on a third-party outage.
   */
  private async fetchUsdVndRate(): Promise<number> {
    try {
      const res = await fetch(EXCHANGE_RATE_API_URL);
      if (!res.ok) {
        throw new Error(`exchange rate API failed: ${res.status}`);
      }
      const json: any = await res.json();
      const rate = Number(json?.rates?.VND);
      if (!(rate > 0)) {
        throw new Error('exchange rate API response missing VND rate');
      }
      return rate;
    } catch (err) {
      console.error('[Wallet] USD/VND exchange rate fetch failed, using fallback rate:', err);
      return FALLBACK_USD_VND_RATE;
    }
  }

  /**
   * Fully automatic USDT top-up: checks the member's own custodial wallet (opBNB) for a
   * USDT balance, sweeps the entire balance to the company treasury address, and credits
   * ZP at the live USD/VND rate (see fetchUsdVndRate) — no admin approval step, unlike the
   * VND/KRW manual bank-transfer flow. The on-chain sweep is irreversible, so the ZP credit
   * + deposit record are written immediately after it confirms, using the tx hash to keep
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

    const usdVndRate = await this.fetchUsdVndRate();
    const zpAmount = Math.round(usdtAmount * usdVndRate);

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
        exchangeRate: usdVndRate,
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
        description: `USDT 자동 충전 (${usdtAmount} USDT × ${usdVndRate.toLocaleString()}, tx: ${receipt.hash})`,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true, usdtAmount, zpCredited: zpAmount, exchangeRate: usdVndRate, txHash: receipt.hash as string };
  }

  /**
   * Converts ZP back into USDT, withholding a 3% platform fee, and pays the net amount
   * out on-chain from the treasury to the member's own custodial wallet. ZP is deducted
   * first (inside a transaction, so concurrent requests can't double-withdraw); if the
   * on-chain payout then fails, the ZP is refunded since the member never received
   * anything. Every withdrawal is logged to TRANSACTIONS (type 'usdt_withdrawal') so it
   * shows up in the admin transactions ledger.
   */
  async withdrawUsdt(uid: string, zpAmount: number, paymentPassword?: string) {
    await this.verifyPaymentPassword(uid, paymentPassword);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);

    await this.db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }
      const currentPoints: number = userSnap.data()?.points ?? 0;
      if (currentPoints < zpAmount) {
        throw new BadRequestException(
          `ZP 잔액이 부족합니다. (필요: ${zpAmount.toLocaleString()} ZP, 보유: ${currentPoints.toLocaleString()} ZP)`,
        );
      }
      tx.update(userRef, { points: FieldValue.increment(-zpAmount) });
    });

    const usdVndRate = await this.fetchUsdVndRate();
    const grossUsdt = zpAmount / usdVndRate;
    const feeUsdt = grossUsdt * USDT_WITHDRAWAL_FEE_RATE;
    const netUsdt = grossUsdt - feeUsdt;

    try {
      const { address } = await this.getOrCreateChainWallet(uid);
      const treasurySigner = this.blockchain.getTreasurySigner();
      const usdt = this.blockchain.getUsdtContract(treasurySigner);
      const netUsdtWei = ethers.parseUnits(netUsdt.toFixed(6), 18);

      const tx = await usdt.transfer(address, netUsdtWei);
      const receipt = await tx.wait();

      const ledgerRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      await ledgerRef.set({
        userId: uid,
        amount: -zpAmount,
        type: 'usdt_withdrawal',
        description: `USDT 환전 출금: ${zpAmount.toLocaleString()} ZP ÷ ${usdVndRate.toLocaleString()} → ${grossUsdt.toFixed(4)} USDT (수수료 3% = ${feeUsdt.toFixed(4)} USDT 차감) → 실지급 ${netUsdt.toFixed(4)} USDT (tx: ${receipt.hash})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        zpDeducted: zpAmount,
        exchangeRate: usdVndRate,
        grossUsdt,
        feeUsdt,
        netUsdt,
        txHash: receipt.hash as string,
      };
    } catch (err) {
      // Payout never arrived — refund the ZP so the member isn't charged for nothing.
      await userRef.update({ points: FieldValue.increment(zpAmount) });
      throw err;
    }
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

    const result = await this.db.runTransaction(async (tx) => {
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

      return {
        id,
        status: 'approved',
        userId: deposit.userId,
        email: deposit.email,
        zpAmount: deposit.zpAmount,
        referredByUid: userSnap.data()?.referredBy ?? null,
      };
    });

    // Post-transaction: grant level-based EXP bonuses (fire-and-forget, do not fail the approval)
    try {
      await this.grantLevelChargeExpBonus(result.userId, result.zpAmount, result.email ?? '');
    } catch (e) {
      console.error('[approveDeposit] grantLevelChargeExpBonus failed:', e);
    }
    if (result.referredByUid) {
      try {
        await this.grantMentorLevelBonus(result.referredByUid, result.email ?? '', result.zpAmount);
      } catch (e) {
        console.error('[approveDeposit] grantMentorLevelBonus failed:', e);
      }
    }

    return { id: result.id, status: result.status };
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
   * Sends ZP from one member to another by email, net of a flat platform fee (see
   * ZP_P2P_TRANSFER_FEE_RATE) — the fee is simply deducted from circulation, not
   * credited anywhere, same shape as withdrawUsdt's fee. Requires the sender's payment
   * password since this moves real balance to a different account, same guard as
   * withdrawUsdt. Recipient lookup/self-transfer guard mirrors TicketsService.transfer().
   */
  async transferZp(
    fromUid: string,
    fromEmail: string,
    toEmail: string,
    zpAmount: number,
    paymentPassword?: string,
  ) {
    if (!Number.isInteger(zpAmount) || zpAmount < MIN_ZP_P2P_TRANSFER) {
      throw new BadRequestException(`ZP 송금은 최소 ${MIN_ZP_P2P_TRANSFER.toLocaleString()} ZP 이상, 정수 단위로만 가능합니다.`);
    }
    await this.verifyPaymentPassword(fromUid, paymentPassword);

    const usersCol = this.db.collection(COLLECTIONS.USERS);
    const toSnap = await usersCol.where('email', '==', toEmail).limit(1).get();
    if (toSnap.empty) {
      throw new NotFoundException('받는 회원을 찾을 수 없습니다. 이메일을 확인해주세요.');
    }
    const toUid = toSnap.docs[0].id;
    if (toUid === fromUid) {
      throw new BadRequestException('본인에게는 ZP를 보낼 수 없습니다.');
    }
    const toWalletSnap = await this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(toUid).get();
    if (!toWalletSnap.exists) {
      throw new NotFoundException('받는 회원이 아직 ZENTARO 멤버십에 가입되어 있지 않습니다.');
    }

    const fee = Math.floor(zpAmount * ZP_P2P_TRANSFER_FEE_RATE);
    const netAmount = zpAmount - fee;
    const fromUserRef = usersCol.doc(fromUid);
    const toUserRef = usersCol.doc(toUid);

    await this.db.runTransaction(async (tx) => {
      const fromSnap = await tx.get(fromUserRef);
      if (!fromSnap.exists) {
        throw new NotFoundException('User not found');
      }
      const currentPoints: number = fromSnap.data()?.points ?? 0;
      if (currentPoints < zpAmount) {
        throw new BadRequestException(
          `ZP 잔액이 부족합니다. (필요: ${zpAmount.toLocaleString()} ZP, 보유: ${currentPoints.toLocaleString()} ZP)`,
        );
      }

      tx.update(fromUserRef, { points: FieldValue.increment(-zpAmount) });
      tx.update(toUserRef, { points: FieldValue.increment(netAmount) });

      const outRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(outRef, {
        userId: fromUid,
        amount: -zpAmount,
        type: 'zp_p2p_transfer_out',
        description: `ZP 송금 (받는 회원: ${toEmail}, ${zpAmount.toLocaleString()} ZP 전송, 수수료 3% = ${fee.toLocaleString()} ZP 차감 → 상대방 수령 ${netAmount.toLocaleString()} ZP)`,
        toUserId: toUid,
        toEmail,
        fee,
        netAmount,
        createdAt: FieldValue.serverTimestamp(),
      });

      const inRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(inRef, {
        userId: toUid,
        amount: netAmount,
        type: 'zp_p2p_transfer_in',
        description: `ZP 송금 수령 (보낸 회원: ${fromEmail}, ${netAmount.toLocaleString()} ZP 수령)`,
        fromUserId: fromUid,
        fromEmail,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { toEmail, zpAmount, fee, netAmount };
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

  /** Spends EXP to raise the member's level. Cost to leave level N is N^2 * 10000 EXP. Max level is 10. */
  async levelUp(uid: string) {
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const walletSnap = await tx.get(walletRef);
      const walletData = walletSnap.exists ? walletSnap.data()! : DEFAULT_WALLET;
      const currentLevel = walletData.level ?? 1;
      const currentExp = walletData.exp ?? 0;

      if (currentLevel >= MAX_LEVEL) {
        throw new BadRequestException(`이미 최고 레벨(Lv.${MAX_LEVEL})입니다.`);
      }

      const cost = expCostForLevel(currentLevel);
      if (currentExp < cost) {
        throw new BadRequestException(
          `레벨업에 EXP가 부족합니다. (필요 ${cost.toLocaleString()} EXP, 보유 ${currentExp.toLocaleString()} EXP)`,
        );
      }

      const nextLevel = currentLevel + 1;
      tx.set(
        walletRef,
        { level: nextLevel, exp: FieldValue.increment(-cost) },
        { merge: true },
      );

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -cost,
        type: 'exp_level_up',
        description: `EXP 레벨업 (Lv.${currentLevel} → Lv.${nextLevel}, -${cost.toLocaleString()} EXP)`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        level: nextLevel,
        exp: currentExp - cost,
        cost,
        nextLevelCost: nextLevel < MAX_LEVEL ? expCostForLevel(nextLevel) : null,
      };
    }).then(async (result) => {
      // Lv.10 unlocks external ZTRO transfer (see /my/benefits) — approved on-chain,
      // best-effort: leveling up must still succeed even if this call fails.
      if (result.level === MAX_LEVEL) {
        this.autoApproveExternalTransfer(uid).catch((err) => {
          console.error('[Wallet] auto-approve external transfer failed:', err);
        });
      }
      return result;
    });
  }

  /** Owner-signed on-chain call granting Lv.10 members permission to transfer ZTRO to an external wallet. */
  private async autoApproveExternalTransfer(uid: string): Promise<void> {
    const { address } = await this.getOrCreateChainWallet(uid);
    const vault = this.blockchain.getVaultContract(this.blockchain.getTreasurySigner());
    const alreadyApproved: boolean = await vault.transferApproved(address);
    if (alreadyApproved) return;
    const tx = await vault.setTransferApproval(address, true);
    await tx.wait();
  }

  /**
   * Grants 5,000 EXP to a mentor when their referral (mentee) completes signup.
   * Called from AuthService after a new user is created (register / googleLogin).
   */
  async grantSignupReferralExp(mentorUid: string, menteeEmail: string): Promise<void> {
    const SIGNUP_REFERRAL_EXP = 5000;
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(mentorUid);
    await this.db.runTransaction(async (tx) => {
      tx.set(walletRef, { exp: FieldValue.increment(SIGNUP_REFERRAL_EXP) }, { merge: true });
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: mentorUid,
        amount: SIGNUP_REFERRAL_EXP,
        type: 'referral_signup_reward',
        description: `신규 추천 가입 보상 (멘티: ${menteeEmail})`,
        menteeEmail,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }

  /**
   * Grants EXP bonus to the charging member equal to (level%) of the ZP charged.
   * e.g. Lv3 charging 100,000 ZP → 3,000 EXP bonus
   */
  async grantLevelChargeExpBonus(uid: string, zpAmount: number, email: string): Promise<void> {
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const walletSnap = await walletRef.get();
    const level: number = walletSnap.exists ? (walletSnap.data()!.level ?? 1) : 1;
    const bonusExp = Math.floor(zpAmount * level / 100);
    if (bonusExp <= 0) return;

    await this.db.runTransaction(async (tx) => {
      tx.set(walletRef, { exp: FieldValue.increment(bonusExp) }, { merge: true });
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: bonusExp,
        type: 'level_charge_exp_bonus',
        description: `레벨 충전 EXP 보너스 (Lv.${level}, ${zpAmount.toLocaleString()} ZP 충전 → +${bonusExp.toLocaleString()} EXP)`,
        chargeZpAmount: zpAmount,
        level,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }

  /**
   * Grants EXP to a mentor equal to (mentor's level%) of the mentee's ZP payment.
   * e.g. Lv3 mentor, mentee pays 100,000 ZP → 3,000 EXP to mentor
   */
  async grantMentorLevelBonus(
    mentorUid: string,
    menteeEmail: string,
    zpPaidByMentee: number,
  ): Promise<void> {
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(mentorUid);
    const walletSnap = await walletRef.get();
    const level: number = walletSnap.exists ? (walletSnap.data()!.level ?? 1) : 1;
    const bonusExp = Math.floor(zpPaidByMentee * level / 100);
    if (bonusExp <= 0) return;

    await this.db.runTransaction(async (tx) => {
      tx.set(walletRef, { exp: FieldValue.increment(bonusExp) }, { merge: true });
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: mentorUid,
        amount: bonusExp,
        type: 'mentor_level_bonus_reward',
        description: `멘토 레벨 EXP 보상 (Lv.${level}, 멘티 ${menteeEmail} ${zpPaidByMentee.toLocaleString()} ZP 결제 → +${bonusExp.toLocaleString()} EXP)`,
        menteeEmail,
        zpPaidByMentee,
        level,
        createdAt: FieldValue.serverTimestamp(),
      });
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

  /**
   * Weekly EXP dividend for ZtaroVaultDAO stakers who linked their external wallet via
   * linkDaoStakingAddress. Mirrors distributeWeeklyStakingRewards below (same weekly
   * cadence, same "staked x level / 1000" shape) but reads each stake's actual locked
   * duration from the vault instead of a flat monthly unit, per the documented formula
   * on /my/benefits: staked Ztaro x level x locked months / 1,000 — paid every week the
   * stake stays active, so a longer lock keeps earning the same weekly amount for as
   * long as it's committed. Only counts once total active stake is >= 10,000 Ztaro.
   */
  @Cron('0 0 * * 0')
  async distributeDaoStakingExpRewards() {
    console.log('[DaoStakingReward] Starting weekly DAO vault staking EXP reward distribution...');
    const MIN_STAKE_FOR_REWARD = DAO_STAKING_MIN_ACTIVE_STAKE;

    try {
      const walletsSnap = await this.db.collection(COLLECTIONS.ZENTARO_WALLETS).get();
      const vault = this.blockchain.getVaultContract(this.blockchain.getProvider());

      let processedCount = 0;
      let totalExpDistributed = 0;

      for (const walletDoc of walletsSnap.docs) {
        const uid = walletDoc.id;
        const walletData = walletDoc.data();
        const address = walletData.daoStakingAddress as string | undefined;
        if (!address) continue;

        try {
          const stakeIds: bigint[] = await vault.getAllStakes(address);
          const level: number = walletData.level ?? 1;
          let totalActiveAmount = 0;
          let expAmount = 0;

          for (const stakeId of stakeIds) {
            const s = await vault.stakes(stakeId);
            if (!s.active) continue;
            const amount = Number(s.amount);
            const months = daoStakingLockMonths(Number(s.lockedUntil), Number(s.createdAt));
            totalActiveAmount += amount;
            expAmount += Math.floor((amount * level * months) / 1000);
          }

          if (totalActiveAmount < MIN_STAKE_FOR_REWARD || expAmount <= 0) continue;

          await this.db.runTransaction(async (tx) => {
            const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
            const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
            tx.set(walletRef, { exp: FieldValue.increment(expAmount) }, { merge: true });
            tx.set(txRef, {
              userId: uid,
              amount: expAmount,
              type: 'dao_staking_exp_reward',
              description: `Ztaro DAO 스테이킹 주간 보상 (활성 스테이킹 ${totalActiveAmount.toLocaleString()} Ztaro × Lv.${level} → +${expAmount.toLocaleString()} EXP)`,
              stakedAmount: totalActiveAmount,
              level,
              createdAt: FieldValue.serverTimestamp(),
            });
          });

          console.log(`[DaoStakingReward] Distributed ${expAmount} EXP to user ${uid} (Lv.${level}, active staked: ${totalActiveAmount})`);
          processedCount++;
          totalExpDistributed += expAmount;
        } catch (walletErr) {
          console.error(`[DaoStakingReward] Error processing wallet address ${address}:`, walletErr);
        }
      }

      console.log(`[DaoStakingReward] Weekly distribution complete. Processed ${processedCount} users. Total EXP: ${totalExpDistributed}`);
      return { processedCount, totalExpDistributed };
    } catch (err) {
      console.error('[DaoStakingReward] Global DAO staking reward distribution error:', err);
      throw err;
    }
  }

  /** Direct Firestore read for verifying payment password, avoiding circular AuthService injection. */
  async verifyPaymentPassword(uid: string, paymentPassword?: string): Promise<void> {
    if (!paymentPassword) {
      throw new BadRequestException('자금이체 비밀번호를 입력해주세요.');
    }
    const snap = await this.db.collection(COLLECTIONS.USERS).doc(uid).get();
    const hash = snap.exists ? snap.data()?.paymentPasswordHash : null;
    if (!hash) {
      throw new BadRequestException('자금이체 비밀번호가 설정되어 있지 않습니다. 먼저 설정해주세요.');
    }
    const matches = await bcrypt.compare(paymentPassword, hash);
    if (!matches) {
      throw new BadRequestException('자금이체 비밀번호가 일치하지 않습니다.');
    }
  }
}
