import { Injectable, Logger } from '@nestjs/common';

// RapidAPI "Beer9" — free tier is capped at 100 requests/month (see
// X-RateLimit-Requests-Limit response header), reset roughly monthly. Unlike
// WHISKY:EDITION/TheCocktailDB this is NOT run on the daily cron — it's a
// deliberate one-time catalog pull triggered from /admin/drinks, guarded by
// DrinksSyncService so it can't accidentally run twice and burn the quota.
const BASE_URL = 'https://beer9.p.rapidapi.com/';
const HOST = 'beer9.p.rapidapi.com';
const PER_PAGE = 100;
// Stop early once few requests remain so this run never fully exhausts the
// month's quota for the rest of the app — leaves headroom for retries/admin checks.
const MIN_REMAINING_TO_CONTINUE = 3;

export interface Beer9Item {
  sku: string;
  name: string;
  brewery: string;
  rating: string;
  category: string;
  sub_category_1: string;
  sub_category_2: string;
  sub_category_3: string;
  description: string;
  region: string;
  country: string;
  abv: string;
  ibu: string;
  tasting_notes: string;
  food_pairing: string;
  suggested_glassware: string;
  beer_type: string;
}

@Injectable()
export class Beer9Adapter {
  private readonly logger = new Logger(Beer9Adapter.name);

  /** Fetches up to maxPages of 100 items each, stopping on a short page, a fetch error, or low remaining quota. */
  async fetchOnce(maxPages: number): Promise<{ items: Beer9Item[]; pagesFetched: number; stoppedReason: string }> {
    const apiKey = process.env.BEER9_API_KEY;
    if (!apiKey) {
      throw new Error('BEER9_API_KEY is not configured');
    }

    const all: Beer9Item[] = [];
    let pagesFetched = 0;
    let stoppedReason = 'max pages reached';

    for (let page = 1; page <= maxPages; page++) {
      let res: Response;
      try {
        res = await fetch(`${BASE_URL}?page=${page}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': HOST,
            'x-rapidapi-key': apiKey,
          },
        });
      } catch (err) {
        this.logger.error(`Beer9 page ${page} fetch threw: ${err}`);
        stoppedReason = `fetch error on page ${page}`;
        break;
      }

      if (!res.ok) {
        this.logger.error(`Beer9 page ${page} failed with status ${res.status}`);
        stoppedReason = `HTTP ${res.status} on page ${page}`;
        break;
      }

      const json: any = await res.json();
      const items: Beer9Item[] = json?.data ?? [];
      pagesFetched += 1;
      all.push(...items);

      if (items.length < PER_PAGE) {
        stoppedReason = 'reached end of catalog';
        break;
      }

      const remaining = Number(res.headers.get('x-ratelimit-requests-remaining'));
      if (Number.isFinite(remaining) && remaining <= MIN_REMAINING_TO_CONTINUE) {
        stoppedReason = `stopped early, only ${remaining} monthly requests left`;
        break;
      }
    }

    return { items: all, pagesFetched, stoppedReason };
  }
}
