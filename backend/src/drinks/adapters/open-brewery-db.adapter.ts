import { Injectable, Logger } from '@nestjs/common';

// Open Brewery DB — free, no API key, no documented hard quota, but the project
// asks integrators to be reasonable about request volume. This is NOT run on the
// daily cron — it's a deliberate one-time catalog pull triggered from /admin/drinks,
// same pattern as Beer9Adapter, so it never runs unattended.
const BASE_URL = 'https://api.openbrewerydb.org/v1/breweries';
const PER_PAGE = 200;
const DELAY_BETWEEN_PAGES_MS = 300;

export interface OpenBreweryDbBrewery {
  id: string;
  name: string;
  brewery_type: string;
  address_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  // The live API returns these as numbers, but treat as possibly-string defensively.
  longitude: number | string | null;
  latitude: number | string | null;
  phone: string | null;
  website_url: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class OpenBreweryDbAdapter {
  private readonly logger = new Logger(OpenBreweryDbAdapter.name);

  /** Fetches up to maxPages of 200 breweries each. Excludes `closed` entries — no longer operating, no value here. */
  async fetchOnce(maxPages: number): Promise<{ items: OpenBreweryDbBrewery[]; pagesFetched: number; stoppedReason: string }> {
    const all: OpenBreweryDbBrewery[] = [];
    let pagesFetched = 0;
    let stoppedReason = 'max pages reached';

    for (let page = 1; page <= maxPages; page++) {
      let res: Response;
      try {
        res = await fetch(`${BASE_URL}?page=${page}&per_page=${PER_PAGE}`);
      } catch (err) {
        this.logger.error(`Open Brewery DB page ${page} fetch threw: ${err}`);
        stoppedReason = `fetch error on page ${page}`;
        break;
      }

      if (!res.ok) {
        this.logger.error(`Open Brewery DB page ${page} failed with status ${res.status}`);
        stoppedReason = `HTTP ${res.status} on page ${page}`;
        break;
      }

      const items: OpenBreweryDbBrewery[] = await res.json();
      pagesFetched += 1;
      all.push(...items.filter((b) => b.brewery_type !== 'closed'));

      if (items.length < PER_PAGE) {
        stoppedReason = 'reached end of catalog';
        break;
      }

      await sleep(DELAY_BETWEEN_PAGES_MS);
    }

    return { items: all, pagesFetched, stoppedReason };
  }
}
