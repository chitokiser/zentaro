import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { WhiskyHunterAdapter } from './adapters/whisky-hunter.adapter';

// Whisky Hunter's underlying dataset only updates monthly and its own docs note
// no fixed refresh cadence, so a 24h cache is generous rather than stale — this
// keeps the ~190 possible detail lookups (160 distilleries + 31 auction houses)
// from ever hammering a free public API on every page view (spec §24).
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isStale(fetchedAt: FirebaseFirestore.Timestamp | null | undefined): boolean {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt.toDate().getTime() > CACHE_TTL_MS;
}

@Injectable()
export class WhiskyMarketService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly whiskyHunter: WhiskyHunterAdapter,
  ) {}

  private distilleriesCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_WHISKY_DISTILLERIES);
  }
  private auctionHousesCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_WHISKY_AUCTION_HOUSES);
  }
  private watchlistCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_WHISKY_WATCHLIST);
  }
  private targetsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_WHISKY_TARGETS);
  }
  private metaDoc(id: string) {
    return this.db.collection(COLLECTIONS.ZENTARO_WHISKY_MARKET_META).doc(id);
  }

  /** Refreshes the distillery/auction-house name catalogs if stale. Never touches per-slug `history`. */
  private async ensureCatalogFresh(): Promise<void> {
    const meta = await this.metaDoc('catalog').get();
    if (!isStale(meta.data()?.lastSyncedAt)) return;

    const [distilleries, auctionHouses] = await Promise.all([
      this.whiskyHunter.fetchDistilleriesInfo(),
      this.whiskyHunter.fetchAuctionsInfo(),
    ]);

    if (distilleries) {
      const batch = this.db.batch();
      for (const d of distilleries) {
        batch.set(
          this.distilleriesCol().doc(d.slug),
          { name: d.name, slug: d.slug, country: d.country, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
      await batch.commit();
    }

    if (auctionHouses) {
      const batch = this.db.batch();
      for (const a of auctionHouses) {
        batch.set(
          this.auctionHousesCol().doc(a.slug),
          {
            name: a.name,
            slug: a.slug,
            url: a.url,
            buyersFee: a.buyers_fee,
            sellersFee: a.sellers_fee,
            reserveFee: a.reserve_fee,
            listingFee: a.listing_fee,
            baseCurrency: a.base_currency,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      await batch.commit();
    }

    if (distilleries || auctionHouses) {
      await this.metaDoc('catalog').set({ lastSyncedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  }

  async listDistilleries(filters: { country?: string; q?: string }) {
    await this.ensureCatalogFresh();
    const snap = await this.distilleriesCol().limit(500).get();
    const q = filters.q?.trim().toLowerCase();
    return snap.docs
      .map((d) => d.data())
      .filter((d) => !filters.country || d.country === filters.country)
      .filter((d) => !q || String(d.name ?? '').toLowerCase().includes(q))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }

  async listAuctionHouses() {
    await this.ensureCatalogFresh();
    const snap = await this.auctionHousesCol().limit(200).get();
    return snap.docs.map((d) => d.data()).sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }

  async getDistillery(slug: string) {
    const ref = this.distilleriesCol().doc(slug);
    let snap = await ref.get();
    if (!snap.exists) {
      await this.ensureCatalogFresh();
      snap = await ref.get();
      if (!snap.exists) throw new NotFoundException('Distillery not found');
    }

    const data = snap.data()!;
    if (isStale(data.historyFetchedAt)) {
      const history = await this.whiskyHunter.fetchDistilleryData(slug);
      if (history) {
        await ref.set({ history, historyFetchedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { ...data, history, historyFetchedAt: null };
      }
    }
    return data;
  }

  async getAuctionHouse(slug: string) {
    const ref = this.auctionHousesCol().doc(slug);
    let snap = await ref.get();
    if (!snap.exists) {
      await this.ensureCatalogFresh();
      snap = await ref.get();
      if (!snap.exists) throw new NotFoundException('Auction house not found');
    }

    const data = snap.data()!;
    if (isStale(data.historyFetchedAt)) {
      const history = await this.whiskyHunter.fetchAuctionData(slug);
      if (history) {
        await ref.set({ history, historyFetchedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { ...data, history, historyFetchedAt: null };
      }
    }
    return data;
  }

  /**
   * Market-wide trend: sums real per-auction-house monthly figures (auction_trading_volume,
   * auction_lots_count) grouped by month, and derives a lots-weighted mean bid across all
   * auctions for that month. This is arithmetic over real API values, not an invented number —
   * same category of derived stat as the existing Bayesian ranking in drinks/ranking.service.ts.
   */
  async getDashboard() {
    await this.ensureCatalogFresh();

    const trendMeta = await this.metaDoc('marketTrend').get();
    let trend: { dt: string; totalTradingVolume: number; totalLots: number; weightedMeanBid: number }[] =
      trendMeta.data()?.points ?? [];

    if (isStale(trendMeta.data()?.fetchedAt)) {
      const raw = await this.whiskyHunter.fetchAllAuctionsData();
      if (raw) {
        const byMonth = new Map<string, { volume: number; lots: number; bidWeighted: number }>();
        for (const point of raw) {
          const acc = byMonth.get(point.dt) ?? { volume: 0, lots: 0, bidWeighted: 0 };
          acc.volume += point.auction_trading_volume ?? 0;
          acc.lots += point.auction_lots_count ?? 0;
          acc.bidWeighted += (point.winning_bid_mean ?? 0) * (point.auction_lots_count ?? 0);
          byMonth.set(point.dt, acc);
        }
        trend = Array.from(byMonth.entries())
          .map(([dt, acc]) => ({
            dt,
            totalTradingVolume: Math.round(acc.volume * 100) / 100,
            totalLots: acc.lots,
            weightedMeanBid: acc.lots > 0 ? Math.round((acc.bidWeighted / acc.lots) * 100) / 100 : 0,
          }))
          .sort((a, b) => a.dt.localeCompare(b.dt));
        await this.metaDoc('marketTrend').set(
          { points: trend, fetchedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
    }

    const [distilleriesSnap, auctionHousesSnap] = await Promise.all([
      this.distilleriesCol().count().get(),
      this.auctionHousesCol().count().get(),
    ]);

    return {
      totalDistilleries: distilleriesSnap.data().count,
      totalAuctionHouses: auctionHousesSnap.data().count,
      lastDataDate: trend.length > 0 ? trend[trend.length - 1].dt : null,
      trend,
      source: 'Whisky Hunter (whiskyhunter.net)',
    };
  }

  async addWatch(uid: string, distillerySlug: string) {
    const distillery = await this.distilleriesCol().doc(distillerySlug).get();
    if (!distillery.exists) throw new NotFoundException('Distillery not found');

    const id = `${uid}_${distillerySlug}`;
    await this.watchlistCol().doc(id).set({
      uid,
      distillerySlug,
      distilleryName: distillery.data()!.name,
      country: distillery.data()!.country ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id };
  }

  async removeWatch(uid: string, distillerySlug: string) {
    await this.watchlistCol().doc(`${uid}_${distillerySlug}`).delete();
    return { ok: true };
  }

  async listWatchlist(uid: string) {
    const snap = await this.watchlistCol().where('uid', '==', uid).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async setTarget(uid: string, distillerySlug: string, targetPrice: number, notificationOn: boolean) {
    const distillery = await this.distilleriesCol().doc(distillerySlug).get();
    if (!distillery.exists) throw new NotFoundException('Distillery not found');

    const id = `${uid}_${distillerySlug}`;
    await this.targetsCol().doc(id).set(
      {
        uid,
        distillerySlug,
        distilleryName: distillery.data()!.name,
        targetPrice,
        notificationOn,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { id };
  }

  async removeTarget(uid: string, distillerySlug: string) {
    await this.targetsCol().doc(`${uid}_${distillerySlug}`).delete();
    return { ok: true };
  }

  /**
   * Status compares the target against the distillery's most recent MONTHLY AVERAGE winning
   * bid — never called "current bid" anywhere, because Whisky Hunter has no live-bid data.
   */
  async listTargets(uid: string) {
    const snap = await this.targetsCol().where('uid', '==', uid).get();
    const targets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

    const results: any[] = [];
    for (const target of targets) {
      const distillery = await this.getDistillery(target.distillerySlug).catch(() => null);
      const history = (distillery as any)?.history as { dt: string; winning_bid_mean: number }[] | undefined;
      const latest = history && history.length > 0 ? history[0] : null;
      results.push({
        ...target,
        latestAvgPrice: latest?.winning_bid_mean ?? null,
        latestAvgDt: latest?.dt ?? null,
        status: latest == null ? 'NO_DATA' : latest.winning_bid_mean <= target.targetPrice ? 'WITHIN_TARGET' : 'OVER_TARGET',
      });
    }
    return results;
  }
}
