import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

function fmtUsdt(wei: bigint): number {
  return Number(ethers.formatUnits(wei, 18));
}

const DELIVERED_STATUS = '직접 배송 완료';
const BOTTLED_STATUS = '병입 완료 및 출고';

/** Platform cut on every P2P barrel resale, taken out of the seller's proceeds. */
const P2P_TRADE_FEE_RATE = 0.15;

/** Barrel room storage fee charged on direct-delivery, as a % of the barrel's live value. */
const BARREL_STORAGE_FEE_RATE = 0.15;

/** Masks an email for display on the public barrel gallery (e.g. "da***@gmail.com"). */
function maskEmail(email: string | null | undefined): string {
  if (!email) return '알 수 없음';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

const BARREL_LITERS: Record<string, number> = {
  '5L': 5,
  '10L': 10,
  '20L': 20,
  '40L': 40,
};

export interface BarrelPricingConfig {
  baseUsdPerLiter: number;
  usdToZpRate: number;
  annualGrowthRate: number;
}

// Defaults per member request: 10 USD/liter (barrel included), 10,000 ZP = 1 USD,
// 25%/year compounding value growth while aging. All three are admin-adjustable.
const DEFAULT_BARREL_PRICING: BarrelPricingConfig = {
  baseUsdPerLiter: 10,
  usdToZpRate: 10000,
  annualGrowthRate: 0.25,
};

const SECONDS_PER_YEAR = 365 * 86400;

/** Cumulative aging seconds from production start to (agingEndedAt ?? now), computed fresh every call. */
function agingSecondsFromDoc(barrel: any): number {
  const startSec = barrel.productionDate?._seconds;
  if (!startSec) return 0;
  const endSec = barrel.agingEndedAt?._seconds ?? Math.floor(Date.now() / 1000);
  return Math.max(0, endSec - startSec);
}

/**
 * Live valuation in ZP: capacity(L) x USD/L x USD-ZP rate, compounded at the configured
 * annual rate over the barrel's cumulative aging time. Recomputed on every read (never
 * cached/stored) so the value keeps climbing between page refreshes.
 */
function computeBarrelValueZp(capacity: string, agingSeconds: number, config: BarrelPricingConfig): number {
  const liters = BARREL_LITERS[capacity] ?? 0;
  const baseZp = liters * config.baseUsdPerLiter * config.usdToZpRate;
  const ageYears = Math.max(0, agingSeconds) / SECONDS_PER_YEAR;
  return Math.round(baseZp * Math.pow(1 + config.annualGrowthRate, ageYears));
}

@Injectable()
export class TokenExchangeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly blockchain: BlockchainService,
    @Inject(FIRESTORE) private readonly db: Firestore,
  ) { }

  async dashboard(uid: string) {
    const { address } = await this.walletService.getOrCreateChainWallet(uid);

    const provider = this.blockchain.getProvider();
    const bank = this.blockchain.getBankContract(provider);
    const usdt = this.blockchain.getUsdtContract(provider);
    const ztro = this.blockchain.getZtroContract(provider);

    const [
      ztroBalance,
      usdtBalance,
      price,
      userInfo,
      dashboardInfo,
      pendingDividend,
      effectiveStaked,
      act,
      rate,
      stakeLock,
      divInterval,
    ] = await Promise.all([
      ztro.balanceOf(address),
      usdt.balanceOf(address),
      bank.price(),
      bank.user(address),
      bank.myDashboard(address),
      bank.pendingDividend(address),
      bank.effectiveStaked(),
      bank.act(),
      bank.rate(),
      bank.STAKE_LOCK(),
      bank.DIV_INTERVAL(),
    ]);

    return {
      address,
      ztroBalance: Number(ztroBalance),
      usdtBalance: fmtUsdt(usdtBalance),
      priceUsdt: fmtUsdt(price),
      staked: Number(userInfo.depo),
      stakingTime: Number(userInfo.stakingTime),
      lastClaim: Number(userInfo.lastClaim),
      avgBuyPriceUsdt: fmtUsdt(dashboardInfo.myAvgBuyPriceWei),
      pnlUsdt: fmtUsdt(dashboardInfo.myPnlWei),
      roiBps: Number(dashboardInfo.myRoiBps_),
      pendingDividendUsdt: fmtUsdt(pendingDividend),
      effectiveStaked: Number(effectiveStaked),
      act: Number(act),
      sellFeePercent: Number(rate),
      stakeLockSeconds: Number(stakeLock),
      divIntervalSeconds: Number(divInterval),
      usdtTokenAddress: await usdt.getAddress(),
    };
  }

  async buy(uid: string, amount: number, maxPayUsdt?: number) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    const usdt = this.blockchain.getUsdtContract(signer);
    const bankAddress = await bank.getAddress();

    const price: bigint = await bank.price();
    const estimatedPay = price * BigInt(amount);

    const allowance: bigint = await usdt.allowance(address, bankAddress);
    if (allowance < estimatedPay) {
      const approveTx = await usdt.approve(bankAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    const maxPay =
      maxPayUsdt !== undefined ? ethers.parseUnits(maxPayUsdt.toString(), 18) : 0n;

    const tx = await bank.buy(amount, maxPay);
    const receipt = await tx.wait();
    return this.parseReceipt(bank, receipt, 'Bought');
  }

  async sell(uid: string, amount: number) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    const ztro = this.blockchain.getZtroContract(signer);
    const bankAddress = await bank.getAddress();

    const allowance: bigint = await ztro.allowance(address, bankAddress);
    if (allowance < BigInt(amount)) {
      const approveTx = await ztro.approve(bankAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    const tx = await bank.sell(amount);
    const receipt = await tx.wait();
    return this.parseReceipt(bank, receipt, 'Sold');
  }

  async stake(uid: string, amount: number) {
    try {
      const { address, privateKey } =
        await this.walletService.getDecryptedPrivateKey(uid);
      await this.blockchain.ensureGas(address);
      const signer = this.blockchain.getUserSigner(privateKey);

      const bank = this.blockchain.getBankContract(signer);
      const ztro = this.blockchain.getZtroContract(signer);
      const bankAddress = await bank.getAddress();

      const allowance: bigint = await ztro.allowance(address, bankAddress);
      if (allowance < BigInt(amount)) {
        const approveTx = await ztro.approve(bankAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await bank.stake(amount);
      const receipt = await tx.wait();
      return { txHash: receipt.hash as string };
    } catch (err) {
      console.error('[TokenExchange] stake error:', err);
      throw new BadRequestException(
        err instanceof Error ? err.message : '스테이킹에 실패했습니다.',
      );
    }
  }

  async unstake(uid: string) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    try {
      const tx = await bank.withdraw();
      const receipt = await tx.wait();
      return { txHash: receipt.hash as string };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : '언스테이킹에 실패했습니다.',
      );
    }
  }

  async claimDividend(uid: string) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    try {
      const tx = await bank.claimDividend();
      const receipt = await tx.wait();
      return this.parseReceipt(bank, receipt, 'DividendClaimed');
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : '배당 청구에 실패했습니다.',
      );
    }
  }

  private parseReceipt(
    bank: ethers.Contract,
    receipt: ethers.ContractTransactionReceipt,
    eventName: string,
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = bank.interface.parseLog(log);
        if (parsed?.name === eventName) {
          return { txHash: receipt.hash, event: parsed.name, args: parsed.args };
        }
      } catch {
        // not our event — ignore
      }
    }
    return { txHash: receipt.hash };
  }

  @Cron('0 0 * * 0')
  async distributeWeeklyStakingRewards() {
    console.log('[StakingReward] Starting weekly ZTRO staking EXP reward distribution...');
    try {
      const walletsSnap = await this.db.collection(COLLECTIONS.ZENTARO_WALLETS).get();
      const provider = this.blockchain.getProvider();
      const bank = this.blockchain.getBankContract(provider);

      let processedCount = 0;
      let totalExpDistributed = 0;

      for (const walletDoc of walletsSnap.docs) {
        const walletData = walletDoc.data();
        const address = walletData.chainAddress;

        if (!address) continue;

        try {
          const userInfo = await bank.user(address);
          const stakedZtro = Number(userInfo.depo);

          const expAmount = Math.floor(stakedZtro / 100); // 10,000 ZTRO staked = 100 EXP/week

          if (expAmount > 0) {
            const userId = walletDoc.id;

            await this.db.runTransaction(async (tx) => {
              const userWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(userId);
              const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();

              tx.set(userWalletRef, { exp: FieldValue.increment(expAmount) }, { merge: true });

              tx.set(txRef, {
                userId,
                amount: expAmount,
                type: 'staking_exp_reward',
                description: `ZTRO 스테이킹 주간 보상 (스테이킹 수량: ${stakedZtro.toLocaleString()} ZTRO)`,
                stakedAmount: stakedZtro,
                createdAt: FieldValue.serverTimestamp(),
              });
            });

            console.log(`[StakingReward] Distributed ${expAmount} EXP to user ${userId} (address: ${address})`);
            processedCount++;
            totalExpDistributed += expAmount;
          }
        } catch (walletErr) {
          console.error(`[StakingReward] Error processing wallet address ${address}:`, walletErr);
        }
      }

      console.log(`[StakingReward] Weekly distribution complete. Processed ${processedCount} users. Total EXP: ${totalExpDistributed}`);
      return { processedCount, totalExpDistributed };
    } catch (err) {
      console.error('[StakingReward] Global staking reward distribution error:', err);
      throw err;
    }
  }

  async createBarrelOrder(uid: string, size: string) {
    const BARREL_REQUIREMENTS: Record<string, { stakedZtro: number; expCost: number }> = {
      '5L': { stakedZtro: 50000, expCost: 500000 },
      '10L': { stakedZtro: 100000, expCost: 1000000 },
      '20L': { stakedZtro: 200000, expCost: 2000000 },
      '40L': { stakedZtro: 400000, expCost: 4000000 },
    };

    const reqs = BARREL_REQUIREMENTS[size];
    if (!reqs) {
      throw new BadRequestException('올바르지 않은 배럴 크기입니다.');
    }

    const { address } = await this.walletService.getOrCreateChainWallet(uid);
    if (!address) {
      throw new BadRequestException('지갑 주소를 가져올 수 없거나 생성되지 않았습니다.');
    }

    const provider = this.blockchain.getProvider();
    const bank = this.blockchain.getBankContract(provider);
    const userInfo = await bank.user(address);
    const stakedZtro = Number(userInfo.depo);

    if (stakedZtro < reqs.stakedZtro) {
      throw new BadRequestException(`ZTRO 스테이킹 요건이 부족합니다. 최소 ${reqs.stakedZtro.toLocaleString()} ZTRO 스테이킹이 필요합니다. (현재: ${stakedZtro.toLocaleString()} ZTRO)`);
    }

    const userWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const userWalletSnap = await userWalletRef.get();
    const walletData = userWalletSnap.exists ? userWalletSnap.data() : null;
    const currentExp = Number(walletData?.exp || 0);

    if (currentExp < reqs.expCost) {
      throw new BadRequestException(`EXP 잔액이 부족합니다. 최소 ${reqs.expCost.toLocaleString()} EXP가 필요합니다. (현재: ${currentExp.toLocaleString()} EXP)`);
    }

    const barrelId = `ZT-REV-${size}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const certNumber = `CERT-ZT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qrKey = Math.random().toString(36).substring(2, 12).toUpperCase();

    await this.db.runTransaction(async (tx) => {
      // Deduct EXP
      tx.set(userWalletRef, { exp: FieldValue.increment(-reqs.expCost) }, { merge: true });

      // Log transaction
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -reqs.expCost,
        type: 'barrel_order',
        description: `ZenTaro Barrel Reserve ${size} 배럴 주문 및 EXP 차감`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Create new barrel document
      const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
      tx.set(barrelRef, {
        id: barrelId,
        userId: uid,
        capacity: size,
        status: 'ordered',
        createdAt: FieldValue.serverTimestamp(),
        productionDate: FieldValue.serverTimestamp(),
        fillingDate: FieldValue.serverTimestamp(),
        agingEndedAt: null,
        forSale: false,
        salePriceZp: null,
        sealStatus: 'SECURED',
        certNumber,
        qrKey,
        ownershipHistory: [
          {
            date: new Date().toISOString(),
            ownerId: uid,
            ownerAddress: address,
            action: 'initial_reservation',
            message: '최초 배럴 예약 및 소유 증명서 발급 완료',
          }
        ]
      });
    });

    return { success: true, barrelId, certNumber };
  }

  async getBarrelPricingConfig(): Promise<BarrelPricingConfig> {
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_BARREL_PRICING_CONFIG).doc('config').get();
    if (!snap.exists) return DEFAULT_BARREL_PRICING;
    const data = snap.data()!;
    return {
      baseUsdPerLiter: data.baseUsdPerLiter ?? DEFAULT_BARREL_PRICING.baseUsdPerLiter,
      usdToZpRate: data.usdToZpRate ?? DEFAULT_BARREL_PRICING.usdToZpRate,
      annualGrowthRate: data.annualGrowthRate ?? DEFAULT_BARREL_PRICING.annualGrowthRate,
    };
  }

  async updateBarrelPricingConfig(patch: Partial<BarrelPricingConfig>): Promise<BarrelPricingConfig> {
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
        throw new BadRequestException(`${key} 값은 0 이상의 숫자여야 합니다.`);
      }
    }
    const ref = this.db.collection(COLLECTIONS.ZENTARO_BARREL_PRICING_CONFIG).doc('config');
    await ref.set(patch, { merge: true });
    return this.getBarrelPricingConfig();
  }

  async listMyBarrels(uid: string) {
    const [snap, pricing] = await Promise.all([
      this.db.collection(COLLECTIONS.ZENTARO_BARRELS).where('userId', '==', uid).get(),
      this.getBarrelPricingConfig(),
    ]);

    const list = snap.docs.map((doc) => {
      const barrel = doc.data() as any;
      return {
        ...barrel,
        currentValueZp: computeBarrelValueZp(barrel.capacity, agingSecondsFromDoc(barrel), pricing),
      };
    });
    return list.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }

  /** Every barrel across every owner, for the public "다른 유저도 볼 수 있는" gallery. Owner email is masked. */
  async listPublicBarrels() {
    const [snap, pricing] = await Promise.all([
      this.db.collection(COLLECTIONS.ZENTARO_BARRELS).get(),
      this.getBarrelPricingConfig(),
    ]);
    const barrels = snap.docs.map((doc) => doc.data() as any);

    const uids = [...new Set(barrels.map((b) => b.userId).filter(Boolean))];
    const userSnaps = await Promise.all(
      uids.map((uid) => this.db.collection(COLLECTIONS.USERS).doc(uid).get()),
    );
    const emailByUid = new Map(userSnaps.map((s) => [s.id, s.data()?.email ?? null]));

    return barrels
      .map((b) => ({
        id: b.id,
        capacity: b.capacity,
        status: b.status,
        sealStatus: b.sealStatus,
        certNumber: b.certNumber,
        productionDate: b.productionDate ?? null,
        agingEndedAt: b.agingEndedAt ?? null,
        forSale: b.forSale ?? false,
        currentValueZp: computeBarrelValueZp(b.capacity, agingSecondsFromDoc(b), pricing),
        ownerLabel: maskEmail(emailByUid.get(b.userId)),
        ownerId: b.userId,
      }))
      .sort((a: any, b: any) => (b.productionDate?.seconds ?? 0) - (a.productionDate?.seconds ?? 0));
  }

  async triggerBarrelAction(uid: string, barrelId: string, action: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const pricing = await this.getBarrelPricingConfig();

    return this.db.runTransaction(async (tx) => {
      const barrelSnap = await tx.get(barrelRef);
      if (!barrelSnap.exists) {
        throw new BadRequestException('존재하지 않는 배럴입니다.');
      }

      const barrelData = barrelSnap.data()!;
      if (barrelData.userId !== uid) {
        throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
      }
      if (barrelData.forSale) {
        throw new BadRequestException('판매 등록 중인 배럴은 서비스를 이용할 수 없습니다. 먼저 판매를 취소해주세요.');
      }

      let nextStatus = barrelData.status;
      let nextSealStatus = barrelData.sealStatus || 'SECURED';
      let historyMessage = '';
      let endsAging = false;

      if (action === 'room_aging') {
        nextStatus = '위탁 숙성 중 (Room Aging)';
        historyMessage = 'ZenTaro Barrel Room 위탁 숙성 시작';
      } else if (action === 'deliver') {
        const currentValueZp = computeBarrelValueZp(
          barrelData.capacity,
          agingSecondsFromDoc(barrelData),
          pricing,
        );
        const fee = Math.round(currentValueZp * BARREL_STORAGE_FEE_RATE);
        const userSnap = await tx.get(userRef);
        const currentPoints: number = userSnap.data()?.points ?? 0;
        if (currentPoints < fee) {
          throw new BadRequestException(
            `배럴룸 보관료 ${fee.toLocaleString()} ZP가 부족합니다. (보유: ${currentPoints.toLocaleString()} ZP)`,
          );
        }
        if (fee > 0) {
          tx.update(userRef, { points: FieldValue.increment(-fee) });
          const feeTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
          tx.set(feeTxRef, {
            userId: uid,
            amount: -fee,
            type: 'barrel_delivery_fee',
            description: `배럴룸 보관료 (${(BARREL_STORAGE_FEE_RATE * 100).toFixed(0)}%, ${barrelData.capacity}, ${barrelId})`,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        nextStatus = DELIVERED_STATUS;
        nextSealStatus = 'DELIVERED (봉인 유지 인도)';
        historyMessage = `자택 직접 배송 요청 접수 및 봉인 인도 (배럴룸 보관료 ${fee.toLocaleString()} ZP 차감)`;
        endsAging = true;
      } else if (action === 'bottle') {
        nextStatus = BOTTLED_STATUS;
        nextSealStatus = 'UNSEALED';
        historyMessage = '개인 병입 완료 및 한정판 스피릿 출고';
        endsAging = true;
      } else if (action === 'extend_aging') {
        nextStatus = '숙성 연장 중';
        historyMessage = '배럴 숙성 기간 연장 신청 접수';
      } else if (action === 'engrave') {
        nextStatus = '각인 완료';
        historyMessage = '개인 기념 문구 배럴 각인 완료';
      } else {
        throw new BadRequestException('정의되지 않은 배럴 액션 서비스입니다.');
      }

      const historyEntry = {
        date: new Date().toISOString(),
        ownerId: uid,
        action,
        message: historyMessage,
      };

      tx.update(barrelRef, {
        status: nextStatus,
        sealStatus: nextSealStatus,
        ownershipHistory: FieldValue.arrayUnion(historyEntry),
        ...(endsAging && !barrelData.agingEndedAt ? { agingEndedAt: FieldValue.serverTimestamp() } : {}),
      });

      return { success: true, nextStatus, nextSealStatus };
    });
  }

  /** Prices are never owner-set — sale price is always the live-computed value at read/buy time. */
  async listBarrelForSale(uid: string, barrelId: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await barrelRef.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    const barrel = snap.data()!;
    if (barrel.userId !== uid) {
      throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
    }
    if (barrel.status === DELIVERED_STATUS || barrel.status === BOTTLED_STATUS) {
      throw new BadRequestException('이미 배송/병입이 완료된 배럴은 판매할 수 없습니다.');
    }
    await barrelRef.update({ forSale: true, salePriceZp: null });
    const pricing = await this.getBarrelPricingConfig();
    const currentValueZp = computeBarrelValueZp(barrel.capacity, agingSecondsFromDoc(barrel), pricing);
    return { success: true, forSale: true, currentValueZp };
  }

  async cancelBarrelSale(uid: string, barrelId: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await barrelRef.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    if (snap.data()!.userId !== uid) {
      throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
    }
    await barrelRef.update({ forSale: false, salePriceZp: null });
    return { success: true, forSale: false };
  }

  async buyBarrel(buyerUid: string, barrelId: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const buyerRef = this.db.collection(COLLECTIONS.USERS).doc(buyerUid);
    const pricing = await this.getBarrelPricingConfig();

    return this.db.runTransaction(async (tx) => {
      const barrelSnap = await tx.get(barrelRef);
      if (!barrelSnap.exists) {
        throw new BadRequestException('존재하지 않는 배럴입니다.');
      }
      const barrel = barrelSnap.data()!;
      if (!barrel.forSale) {
        throw new BadRequestException('판매 중인 배럴이 아닙니다.');
      }
      if (barrel.userId === buyerUid) {
        throw new BadRequestException('본인 소유 배럴은 구매할 수 없습니다.');
      }

      const sellerUid = barrel.userId;
      // Priced live at the moment of purchase — never a stale stored value.
      const price = computeBarrelValueZp(barrel.capacity, agingSecondsFromDoc(barrel), pricing);
      const fee = Math.round(price * P2P_TRADE_FEE_RATE);
      const sellerReceives = price - fee;

      const [buyerSnap, sellerSnap] = await Promise.all([
        tx.get(buyerRef),
        tx.get(this.db.collection(COLLECTIONS.USERS).doc(sellerUid)),
      ]);
      const buyerPoints: number = buyerSnap.data()?.points ?? 0;
      if (buyerPoints < price) {
        throw new BadRequestException(`ZP 잔액이 부족합니다. (필요: ${price.toLocaleString()} ZP, 보유: ${buyerPoints.toLocaleString()} ZP)`);
      }
      if (!sellerSnap.exists) {
        throw new BadRequestException('판매자 정보를 찾을 수 없습니다.');
      }

      const sellerRef = this.db.collection(COLLECTIONS.USERS).doc(sellerUid);
      tx.update(buyerRef, { points: FieldValue.increment(-price) });
      tx.update(sellerRef, { points: FieldValue.increment(sellerReceives) });

      const historyEntry = {
        date: new Date().toISOString(),
        ownerId: buyerUid,
        action: 'sold',
        message: `${price.toLocaleString()} ZP에 소유권 이전 (수수료 ${fee.toLocaleString()} ZP 차감, 이전 소유자: ${sellerUid})`,
      };

      tx.update(barrelRef, {
        userId: buyerUid,
        forSale: false,
        salePriceZp: null,
        ownershipHistory: FieldValue.arrayUnion(historyEntry),
      });

      const buyerTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(buyerTxRef, {
        userId: buyerUid,
        amount: -price,
        type: 'barrel_resale',
        description: `배럴 구매 (${barrelId})`,
        createdAt: FieldValue.serverTimestamp(),
      });
      const sellerTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(sellerTxRef, {
        userId: sellerUid,
        amount: sellerReceives,
        type: 'barrel_resale',
        description: `배럴 판매 (${barrelId}, 거래 수수료 ${(P2P_TRADE_FEE_RATE * 100).toFixed(0)}% 차감 후 실수령)`,
        createdAt: FieldValue.serverTimestamp(),
      });
      if (fee > 0) {
        const feeTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
        tx.set(feeTxRef, {
          userId: sellerUid,
          amount: -fee,
          type: 'barrel_resale_fee',
          description: `배럴 P2P 거래 수수료 ${(P2P_TRADE_FEE_RATE * 100).toFixed(0)}% (${barrelId})`,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return { success: true, barrelId, newOwnerId: buyerUid };
    });
  }

  async deleteBarrelAdmin(barrelId: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await barrelRef.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    if (snap.data()!.status !== DELIVERED_STATUS) {
      throw new BadRequestException('직접 배송 완료 상태의 배럴만 삭제할 수 있습니다.');
    }
    await barrelRef.delete();
    return { success: true, barrelId };
  }
}
