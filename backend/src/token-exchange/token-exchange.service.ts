import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import {
  BARREL_LITERS,
  CHAR_LEVEL_DEFAULT,
  AGING_ENVIRONMENTS,
  AGING_ENVIRONMENT_DEFAULT,
  AGING_ENHANCEMENTS,
  FINISHING_OPTIONS,
  BARREL_PRICE_PER_LITER_EXP,
  BARREL_PRICE_PER_LITER_ZP,
  BARREL_STAKE_PER_LITER_ZTRO,
} from './barrel-options';

function fmtUsdt(wei: bigint): number {
  return Number(ethers.formatUnits(wei, 18));
}

const DELIVERED_STATUS = '직접 배송 완료';
const BOTTLED_STATUS = '병입 완료 및 출고';
const ROOM_AGING_STATUS = '위탁 숙성 중 (Room Aging)';

/** Time between order/payment and the oak barrel actually being filled and starting to age; no growth or "aging" status during this window. */
const BARREL_PREP_SECONDS = 24 * 60 * 60;

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

/**
 * Cumulative aging seconds from production start to (agingEndedAt ?? now), computed fresh every call.
 * Net of BARREL_PREP_SECONDS: the barrel is being filled/prepped for the first 24h and isn't aging yet.
 */
function agingSecondsFromDoc(barrel: any): number {
  const startSec = barrel.productionDate?._seconds;
  if (!startSec) return 0;
  const endSec = barrel.agingEndedAt?._seconds ?? Math.floor(Date.now() / 1000);
  return Math.max(0, endSec - startSec - BARREL_PREP_SECONDS);
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

/** Blend master's 0-500 taste score maps to the barrel's annual growth rate: base 1.25x + score/100 (1점=1.26x, 100점=2.25x). */
function annualGrowthRateFromScore(score: number): number {
  return 0.25 + score / 100;
}

/**
 * Barrels auto-advance from 'ordered' (being filled/prepped) to aging once BARREL_PREP_SECONDS
 * has passed since productionDate — no manual "start aging" action needed. Computed on every
 * read rather than written to Firestore, consistent with how valuation is never cached either.
 */
function effectiveStatus(barrel: any): string {
  if (barrel.status !== 'ordered') return barrel.status;
  const startSec = barrel.productionDate?._seconds;
  if (!startSec) return barrel.status;
  const elapsed = Math.floor(Date.now() / 1000) - startSec;
  return elapsed >= BARREL_PREP_SECONDS ? ROOM_AGING_STATUS : barrel.status;
}

/** Admins can override a specific barrel's annual growth rate; falls back to the global config when unset. */
function effectivePricingForBarrel(barrel: any, config: BarrelPricingConfig): BarrelPricingConfig {
  const override = barrel?.customAnnualGrowthRate;
  if (typeof override === 'number' && Number.isFinite(override)) {
    return { ...config, annualGrowthRate: override };
  }
  return config;
}

/**
 * Live valuation plus flat-fee bonus value from purchased aging enhancements
 * and finishing options (each ZP spent on those is added 1:1 to the barrel's
 * tracked worth, on top of the normal compounding curve).
 */
function totalBarrelValueZp(barrel: any, config: BarrelPricingConfig): number {
  const compounded = computeBarrelValueZp(
    barrel.capacity,
    agingSecondsFromDoc(barrel),
    effectivePricingForBarrel(barrel, config),
  );
  return compounded + (typeof barrel.bonusValueZp === 'number' ? barrel.bonusValueZp : 0);
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

  async createBarrelOrder(uid: string, size: string, agingEnvironment?: string) {
    const resolvedAgingEnvironment =
      agingEnvironment && (AGING_ENVIRONMENTS as readonly string[]).includes(agingEnvironment)
        ? agingEnvironment
        : AGING_ENVIRONMENT_DEFAULT;

    const liters = BARREL_LITERS[size];
    if (!liters) {
      throw new BadRequestException('올바르지 않은 배럴 크기입니다.');
    }
    // 200,000 EXP or 200,000 ZP per liter, same total either way. Paying with EXP
    // additionally requires 10,000 ZTRO staked per liter; ZP has no staking requirement.
    const reqs = {
      stakedZtro: liters * BARREL_STAKE_PER_LITER_ZTRO,
      expCost: liters * BARREL_PRICE_PER_LITER_EXP,
      zpCost: liters * BARREL_PRICE_PER_LITER_ZP,
    };

    const { address } = await this.walletService.getOrCreateChainWallet(uid);
    if (!address) {
      throw new BadRequestException('지갑 주소를 가져올 수 없거나 생성되지 않았습니다.');
    }

    const provider = this.blockchain.getProvider();
    const bank = this.blockchain.getBankContract(provider);
    const userInfo = await bank.user(address);
    const stakedZtro = Number(userInfo.depo);

    const userWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const userWalletSnap = await userWalletRef.get();
    const walletData = userWalletSnap.exists ? userWalletSnap.data() : null;
    const currentExp = Number(walletData?.exp || 0);

    const meetsStakeAndExp = stakedZtro >= reqs.stakedZtro && currentExp >= reqs.expCost;

    let paymentMethod: 'exp' | 'zp';
    if (meetsStakeAndExp) {
      paymentMethod = 'exp';
    } else {
      const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
      const userSnap = await userRef.get();
      const currentPoints = Number(userSnap.data()?.points || 0);
      if (currentPoints < reqs.zpCost) {
        throw new BadRequestException(
          `주문 자격 요건이 부족합니다. 최소 ${reqs.stakedZtro.toLocaleString()} ZTRO 스테이킹 + ${reqs.expCost.toLocaleString()} EXP가 필요하거나, ZP로는 ${reqs.zpCost.toLocaleString()} ZP가 필요합니다. (현재: ${stakedZtro.toLocaleString()} ZTRO, ${currentExp.toLocaleString()} EXP, ${currentPoints.toLocaleString()} ZP)`,
        );
      }
      paymentMethod = 'zp';
    }

    const barrelId = `ZT-REV-${size}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const certNumber = `CERT-ZT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qrKey = Math.random().toString(36).substring(2, 12).toUpperCase();

    await this.db.runTransaction(async (tx) => {
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();

      if (paymentMethod === 'exp') {
        tx.set(userWalletRef, { exp: FieldValue.increment(-reqs.expCost) }, { merge: true });
        tx.set(txRef, {
          userId: uid,
          amount: -reqs.expCost,
          type: 'barrel_order',
          description: `ZenTaro Barrel Reserve ${size} 배럴 주문 및 EXP 차감`,
          createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
        tx.update(userRef, { points: FieldValue.increment(-reqs.zpCost) });
        tx.set(txRef, {
          userId: uid,
          amount: -reqs.zpCost,
          type: 'barrel_order',
          description: `ZenTaro Barrel Reserve ${size} 배럴 주문 및 ZP 차감`,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

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
        charLevel: CHAR_LEVEL_DEFAULT,
        agingEnvironment: resolvedAgingEnvironment,
        enhancements: [],
        finishing: null,
        bonusValueZp: 0,
        ownershipHistory: [
          {
            date: new Date().toISOString(),
            ownerId: uid,
            ownerAddress: address,
            action: 'initial_reservation',
            message: paymentMethod === 'exp'
              ? '최초 배럴 예약 및 소유 증명서 발급 완료'
              : `최초 배럴 예약 및 소유 증명서 발급 완료 (ZP 결제 ${reqs.zpCost.toLocaleString()} ZP)`,
          }
        ]
      });
    });

    return { success: true, barrelId, certNumber, paymentMethod, paidAmount: paymentMethod === 'exp' ? reqs.expCost : reqs.zpCost };
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

  /** Per-barrel override of the annual growth rate; pass null to revert to the global default. */
  async updateBarrelGrowthRateAdmin(barrelId: string, annualGrowthRate: number | null) {
    if (annualGrowthRate !== null && (!Number.isFinite(annualGrowthRate) || annualGrowthRate < 0)) {
      throw new BadRequestException('연간 성장률은 0 이상의 숫자이거나 null(기본값 사용)이어야 합니다.');
    }
    const ref = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    await ref.update({ customAnnualGrowthRate: annualGrowthRate });

    const pricing = await this.getBarrelPricingConfig();
    const barrel = { ...(snap.data() as any), customAnnualGrowthRate: annualGrowthRate };
    const currentValueZp = totalBarrelValueZp(barrel, pricing);
    return { success: true, barrelId, customAnnualGrowthRate: annualGrowthRate, currentValueZp };
  }

  /** Adds a flavor add-on any time while the barrel is still aging, priced per liter of capacity; each enhancement is one-time-only per barrel. */
  async addBarrelEnhancement(uid: string, barrelId: string, enhancementId: string) {
    const option = AGING_ENHANCEMENTS[enhancementId];
    if (!option) {
      throw new BadRequestException('존재하지 않는 인핸스먼트 옵션입니다.');
    }
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const pricing = await this.getBarrelPricingConfig();

    return this.db.runTransaction(async (tx) => {
      const [barrelSnap, userSnap] = await Promise.all([tx.get(barrelRef), tx.get(userRef)]);
      if (!barrelSnap.exists) {
        throw new BadRequestException('존재하지 않는 배럴입니다.');
      }
      const barrel = barrelSnap.data()!;
      if (barrel.userId !== uid) {
        throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
      }
      if (barrel.forSale) {
        throw new BadRequestException('판매 등록 중인 배럴은 옵션을 추가할 수 없습니다.');
      }
      if (barrel.agingEndedAt) {
        throw new BadRequestException('숙성이 종료된 배럴에는 인핸스먼트를 추가할 수 없습니다.');
      }
      const enhancements: string[] = barrel.enhancements ?? [];
      if (enhancements.includes(enhancementId)) {
        throw new BadRequestException('이미 추가된 인핸스먼트 옵션입니다.');
      }

      const liters = BARREL_LITERS[barrel.capacity] ?? 0;
      const cost = liters * option.pricePerLiterZp;

      const currentPoints: number = userSnap.data()?.points ?? 0;
      if (currentPoints < cost) {
        throw new BadRequestException(
          `${cost.toLocaleString()} ZP가 필요합니다. (보유: ${currentPoints.toLocaleString()} ZP)`,
        );
      }

      tx.update(userRef, { points: FieldValue.increment(-cost) });
      tx.update(barrelRef, {
        enhancements: FieldValue.arrayUnion(enhancementId),
        bonusValueZp: FieldValue.increment(cost),
        ownershipHistory: FieldValue.arrayUnion({
          date: new Date().toISOString(),
          ownerId: uid,
          action: 'enhancement_added',
          message: `숙성 인핸스먼트 추가: ${enhancementId} (${liters}L × ${option.pricePerLiterZp.toLocaleString()} ZP/L = ${cost.toLocaleString()} ZP)`,
        }),
      });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -cost,
        type: 'barrel_enhancement',
        description: `배럴 숙성 인핸스먼트 (${enhancementId}, ${barrelId})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      const currentValueZp = totalBarrelValueZp(
        { ...barrel, bonusValueZp: (barrel.bonusValueZp ?? 0) + cost },
        pricing,
      );
      return { success: true, barrelId, enhancementId, cost, currentValueZp };
    });
  }

  /** Applies a single pre-bottling finishing pass, priced per liter of barrel capacity; only one finishing per barrel. */
  async applyBarrelFinishing(uid: string, barrelId: string, finishId: string, days: number) {
    const option = FINISHING_OPTIONS[finishId];
    if (!option) {
      throw new BadRequestException('존재하지 않는 피니시 옵션입니다.');
    }
    if (!Number.isFinite(days) || days < option.minDays || days > option.maxDays) {
      throw new BadRequestException(`피니시 기간은 ${option.minDays}일 ~ ${option.maxDays}일 사이여야 합니다.`);
    }

    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const pricing = await this.getBarrelPricingConfig();

    return this.db.runTransaction(async (tx) => {
      const [barrelSnap, userSnap] = await Promise.all([tx.get(barrelRef), tx.get(userRef)]);
      if (!barrelSnap.exists) {
        throw new BadRequestException('존재하지 않는 배럴입니다.');
      }
      const barrel = barrelSnap.data()!;
      if (barrel.userId !== uid) {
        throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
      }
      if (barrel.forSale) {
        throw new BadRequestException('판매 등록 중인 배럴은 피니시를 적용할 수 없습니다.');
      }
      if (barrel.agingEndedAt) {
        throw new BadRequestException('숙성이 종료된 배럴에는 피니시를 적용할 수 없습니다.');
      }
      if (barrel.finishing) {
        throw new BadRequestException('이미 피니시 옵션을 신청한 배럴입니다.');
      }

      const liters = BARREL_LITERS[barrel.capacity] ?? 0;
      const cost = liters * option.pricePerLiterZp;
      const currentPoints: number = userSnap.data()?.points ?? 0;
      if (currentPoints < cost) {
        throw new BadRequestException(
          `${cost.toLocaleString()} ZP가 필요합니다. (보유: ${currentPoints.toLocaleString()} ZP)`,
        );
      }

      // Payment is taken on request, but the actual finishing period only starts once
      // ZenTaro's blend master physically applies it (startBarrelFinishingAdmin).
      const finishing = { id: finishId, days, requestedAt: new Date().toISOString(), startedAt: null };
      tx.update(userRef, { points: FieldValue.increment(-cost) });
      tx.update(barrelRef, {
        finishing,
        bonusValueZp: FieldValue.increment(cost),
        ownershipHistory: FieldValue.arrayUnion({
          date: new Date().toISOString(),
          ownerId: uid,
          action: 'finishing_requested',
          message: `피니시 신청: ${finishId} (${days}일 희망, ${cost.toLocaleString()} ZP 결제 완료, 젠타로 블렌드마스터 적용 대기중)`,
        }),
      });

      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -cost,
        type: 'barrel_finishing',
        description: `배럴 피니시 신청 (${finishId}, ${days}일, ${barrelId})`,
        createdAt: FieldValue.serverTimestamp(),
      });

      const currentValueZp = totalBarrelValueZp(
        { ...barrel, bonusValueZp: (barrel.bonusValueZp ?? 0) + cost },
        pricing,
      );
      return { success: true, barrelId, finishing, currentValueZp };
    });
  }

  /** ZenTaro's blend master marks a requested finishing as physically started; only then does its period begin. */
  async startBarrelFinishingAdmin(barrelId: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await barrelRef.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    const barrel = snap.data()!;
    if (!barrel.finishing) {
      throw new BadRequestException('신청된 피니시 옵션이 없습니다.');
    }
    if (barrel.finishing.startedAt) {
      throw new BadRequestException('이미 적용이 시작된 피니시입니다.');
    }

    const startedAt = new Date().toISOString();
    await barrelRef.update({
      'finishing.startedAt': startedAt,
      ownershipHistory: FieldValue.arrayUnion({
        date: startedAt,
        ownerId: barrel.userId,
        action: 'finishing_started',
        message: `젠타로 블렌드마스터가 피니시(${barrel.finishing.id}) 적용을 시작했습니다.`,
      }),
    });
    return { success: true, barrelId, finishing: { ...barrel.finishing, startedAt } };
  }

  /** ZenTaro's blend master rates a barrel's aging quality (0-500 taste score + optional note); score drives the barrel's annual growth rate and is shown publicly on the gallery. */
  async setBarrelEvaluationAdmin(barrelId: string, score: number, comment: string | undefined, adminEmail: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const snap = await barrelRef.get();
    if (!snap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }
    const barrel = snap.data()!;
    const trimmedComment = comment?.trim() || null;
    const annualGrowthRate = annualGrowthRateFromScore(score);

    await barrelRef.update({
      blendMasterScore: score,
      blendMasterComment: trimmedComment,
      customAnnualGrowthRate: annualGrowthRate,
      ownershipHistory: FieldValue.arrayUnion({
        date: new Date().toISOString(),
        ownerId: barrel.userId,
        action: 'blend_master_evaluation',
        message: `젠타로 블렌드마스터 평가 등록 (${adminEmail}): ${score}/500점 (연 수익률 ${(1 + annualGrowthRate).toFixed(2)}x) ${trimmedComment ?? ''}`.trim(),
      }),
    });

    const pricing = await this.getBarrelPricingConfig();
    const updatedBarrel = { ...barrel, customAnnualGrowthRate: annualGrowthRate, bonusValueZp: barrel.bonusValueZp ?? 0 };
    const currentValueZp = totalBarrelValueZp(updatedBarrel, pricing);
    return {
      success: true,
      barrelId,
      blendMasterScore: score,
      blendMasterComment: trimmedComment,
      customAnnualGrowthRate: annualGrowthRate,
      currentValueZp,
    };
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
        status: effectiveStatus(barrel),
        currentValueZp: totalBarrelValueZp(barrel, pricing),
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
        status: effectiveStatus(b),
        sealStatus: b.sealStatus,
        certNumber: b.certNumber,
        productionDate: b.productionDate ?? null,
        agingEndedAt: b.agingEndedAt ?? null,
        forSale: b.forSale ?? false,
        currentValueZp: totalBarrelValueZp(b, pricing),
        customAnnualGrowthRate: typeof b.customAnnualGrowthRate === 'number' ? b.customAnnualGrowthRate : null,
        charLevel: b.charLevel ?? CHAR_LEVEL_DEFAULT,
        agingEnvironment: b.agingEnvironment ?? AGING_ENVIRONMENT_DEFAULT,
        enhancements: b.enhancements ?? [],
        finishing: b.finishing ?? null,
        blendMasterScore: typeof b.blendMasterScore === 'number' ? b.blendMasterScore : null,
        blendMasterComment: b.blendMasterComment ?? null,
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
        nextStatus = ROOM_AGING_STATUS;
        historyMessage = 'ZenTaro Barrel Room 위탁 숙성 시작';
      } else if (action === 'deliver') {
        const currentValueZp = totalBarrelValueZp(barrelData, pricing);
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
        historyMessage = `자택 직접 배송 요청 접수 및 봉인 인도 (배럴룸 보관료 ${fee.toLocaleString()} ZP 차감, 실제 배송비는 착불)`;
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
    const currentValueZp = totalBarrelValueZp(barrel, pricing);
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
      const price = totalBarrelValueZp(barrel, pricing);
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
