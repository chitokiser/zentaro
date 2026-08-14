import { Injectable, Logger } from '@nestjs/common';

// Verified against https://whiskyhunter.net/api/?format=openapi — fully public,
// no API key/auth required for these 5 read-only endpoints. All prices are GBP.
// IMPORTANT: this API only ever returns MONTHLY AGGREGATE stats per auction house
// or per distillery (winning_bid_mean/min/max, trading_volume, lots_count) — there
// is no live-lot, per-bottle, or current-bid endpoint. Never invent one.
const BASE_URL = 'https://whiskyhunter.net/api';

export interface WhiskyHunterAuctionInfo {
  name: string;
  slug: string;
  url: string;
  buyers_fee: number;
  sellers_fee: number;
  reserve_fee: number;
  listing_fee: number;
  base_currency: string;
}

export interface WhiskyHunterDistilleryInfo {
  name: string;
  slug: string;
  country: string;
}

export interface WhiskyHunterAuctionDataPoint {
  dt: string;
  winning_bid_mean: number;
  auction_trading_volume: number;
  auction_lots_count: number;
  all_auctions_lots_count: number;
  auction_name: string;
  auction_slug: string;
}

export interface WhiskyHunterDistilleryDataPoint {
  dt: string;
  winning_bid_max: number;
  winning_bid_min: number;
  winning_bid_mean: number;
  trading_volume: number;
  lots_count: number;
  slug: string;
  name: string;
}

@Injectable()
export class WhiskyHunterAdapter {
  private readonly logger = new Logger(WhiskyHunterAdapter.name);

  private async getJson<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        this.logger.error(
          `Whisky Hunter ${path} failed with status ${res.status}`,
        );
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.error(`Whisky Hunter ${path} fetch threw: ${err}`);
      return null;
    }
  }

  fetchAuctionsInfo(): Promise<WhiskyHunterAuctionInfo[] | null> {
    return this.getJson<WhiskyHunterAuctionInfo[]>('/auctions_info');
  }

  fetchDistilleriesInfo(): Promise<WhiskyHunterDistilleryInfo[] | null> {
    return this.getJson<WhiskyHunterDistilleryInfo[]>('/distilleries_info/');
  }

  /** All online auctions' monthly aggregates in one call — used for the market-wide trend on the dashboard. */
  fetchAllAuctionsData(): Promise<WhiskyHunterAuctionDataPoint[] | null> {
    return this.getJson<WhiskyHunterAuctionDataPoint[]>('/auctions_data/');
  }

  fetchAuctionData(
    slug: string,
  ): Promise<WhiskyHunterAuctionDataPoint[] | null> {
    return this.getJson<WhiskyHunterAuctionDataPoint[]>(
      `/auction_data/${encodeURIComponent(slug)}/`,
    );
  }

  fetchDistilleryData(
    slug: string,
  ): Promise<WhiskyHunterDistilleryDataPoint[] | null> {
    return this.getJson<WhiskyHunterDistilleryDataPoint[]>(
      `/distillery_data/${encodeURIComponent(slug)}/`,
    );
  }
}
