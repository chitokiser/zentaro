import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

const ZTARO_POOL_URL =
  'https://api.geckoterminal.com/api/v2/networks/opbnb/pools/0x5a65805fb99cf5b7e50d567c4029af62531be53c';

/**
 * Ztaro checkout price = discounted ZP price, converted through the ZP<->USD peg
 * already used for the ZP/USDT top-up rate (see USDT_TO_ZP_RATE in wallet.service.ts:
 * 1 USDT = 10,000 ZP, i.e. 1 ZP = $0.0001). This is what makes the 명품관 spec's worked
 * examples (100,000 ZP @ $0.0001/Ztaro -> 70,000 Ztaro; @ $0.0002 -> 35,000 Ztaro) come
 * out right — the spec's own "discountPrice / 시세" formula only holds once 시세 is
 * expressed in ZP-per-Ztaro terms via this same peg, not raw USD.
 */
const USDT_TO_ZP_RATE = 10000;

const DEFAULT_DISCOUNT_RATE = 0.3;

/** Kept as a label for the original curated category; no longer gates ZTARO pricing/checkout. */
export const LUXURY_MALL_CATEGORY = '명품관';

/**
 * ZTARO price = discounted ZP price, floored so it never sells below cost — a thin-margin
 * product just settles at cost (0 profit) instead of going negative when discountRate would
 * otherwise cut deeper than its margin.
 */
export function computeZtaroPrice(
  priceAp: number,
  costAp: number,
  zpPerZtaro: number,
  discountRate: number,
): number {
  if (!(zpPerZtaro > 0)) return 0;
  const effectivePriceAp = Math.max(priceAp * (1 - discountRate), costAp);
  return Math.floor(effectivePriceAp / zpPerZtaro);
}

@Injectable()
export class ZtaroPricingService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private snapshotRef() {
    return this.db.collection(COLLECTIONS.ZENTARO_ZTARO_PRICE_SNAPSHOTS).doc('current');
  }

  private discountConfigRef() {
    return this.db.collection(COLLECTIONS.ZENTARO_ZTARO_PRICING_CONFIG).doc('config');
  }

  /** Same GeckoTerminal pool/field the frontend already reads in ztro-pool-info.tsx. */
  private async fetchZtaroUsdPrice(): Promise<number> {
    const res = await fetch(ZTARO_POOL_URL);
    if (!res.ok) {
      throw new Error(`GeckoTerminal request failed: ${res.status}`);
    }
    const json: any = await res.json();
    const usdPrice = Number(json?.data?.attributes?.base_token_price_usd);
    if (!(usdPrice > 0)) {
      throw new Error('GeckoTerminal response missing base_token_price_usd');
    }
    return usdPrice;
  }

  /** Today's fixed rate for ZTARO checkout pricing, fetching+storing one if none exists yet. */
  async getCurrentZpPerZtaro(): Promise<number> {
    const snap = await this.snapshotRef().get();
    const stored = snap.exists ? (snap.data()!.zpPerZtaro as number) : 0;
    if (stored > 0) return stored;
    return this.refreshSnapshot();
  }

  /** Admin-configurable discount rate (fraction, e.g. 0.3 = 30% off), default 30%. */
  async getDiscountRate(): Promise<number> {
    const snap = await this.discountConfigRef().get();
    const stored = snap.exists ? (snap.data()!.discountRate as number) : undefined;
    return typeof stored === 'number' && stored >= 0 ? stored : DEFAULT_DISCOUNT_RATE;
  }

  /** Persists the new discount rate and immediately reprices every product against it. */
  async updateDiscountRate(discountRate: number): Promise<{ discountRate: number }> {
    await this.discountConfigRef().set({
      discountRate,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const zpPerZtaro = await this.getCurrentZpPerZtaro();
    await this.recalcAllProducts(zpPerZtaro, discountRate);
    return { discountRate };
  }

  /**
   * Fetches a fresh GeckoTerminal price and stores it as the day's fixed snapshot. On
   * fetch failure, keeps whatever was last stored (checkout must keep working even if
   * GeckoTerminal has a bad moment) and returns that instead.
   */
  async refreshSnapshot(): Promise<number> {
    try {
      const usdPrice = await this.fetchZtaroUsdPrice();
      const zpPerZtaro = usdPrice * USDT_TO_ZP_RATE;
      await this.snapshotRef().set({
        usdPrice,
        zpPerZtaro,
        capturedAt: FieldValue.serverTimestamp(),
      });
      return zpPerZtaro;
    } catch (err) {
      console.error('[ZtaroPricing] GeckoTerminal fetch failed, keeping previous snapshot:', err);
      const snap = await this.snapshotRef().get();
      return snap.exists ? ((snap.data()!.zpPerZtaro as number) ?? 0) : 0;
    }
  }

  /** Recomputes priceZtaro for every product in the mall against the given rate/discount. */
  async recalcAllProducts(zpPerZtaro: number, discountRate: number): Promise<void> {
    if (!(zpPerZtaro > 0)) return;
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).get();
    if (snap.empty) return;

    const batch = this.db.batch();
    snap.docs.forEach((doc) => {
      const priceAp: number = doc.data().priceAp ?? 0;
      const costAp: number = doc.data().costAp ?? priceAp;
      batch.update(doc.ref, { priceZtaro: computeZtaroPrice(priceAp, costAp, zpPerZtaro, discountRate) });
    });
    await batch.commit();
  }

  @Cron('0 8 * * *', { timeZone: 'Asia/Bangkok' })
  async dailySnapshotAndRecalc(): Promise<void> {
    console.log('[ZtaroPricing] Running daily 08:00 GeckoTerminal snapshot + mall-wide price recalc...');
    const [zpPerZtaro, discountRate] = await Promise.all([this.refreshSnapshot(), this.getDiscountRate()]);
    await this.recalcAllProducts(zpPerZtaro, discountRate);
    console.log(`[ZtaroPricing] Done. zpPerZtaro=${zpPerZtaro} discountRate=${discountRate}`);
  }
}
