import { Injectable, Logger } from '@nestjs/common';

// Verified against https://thewhiskyedition.com/openapi.yaml — no API key required,
// data is licensed CC BY 4.0 (attribution link back to WHISKY:EDITION is mandatory
// wherever a review is shown, see ZENTARO_DRINKS_SOURCES / product.sourceUrl).
const BASE_URL = 'https://thewhiskyedition.com/api';
const PER_PAGE = 24;
const MAX_PAGES = 60; // safety cap (~1,440 reviews) so a bug upstream can't loop forever

export interface WhiskyEditionRating {
  marcel?: number;
  sascha?: number;
  florian?: number;
  lucas?: number;
  value_for_money?: number;
}

export interface WhiskyEditionMetadata {
  type?: string;
  country?: string;
  region?: string;
  distillery?: string;
  bottler?: string;
  age?: number;
  abv?: number;
  price_per_liter?: number;
  flavour?: string;
}

export interface WhiskyEditionReview {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: { url?: string; alt?: string };
  authors?: string[];
  published_at?: string;
  rating?: WhiskyEditionRating;
  url?: string;
  metadata?: WhiskyEditionMetadata;
}

@Injectable()
export class WhiskyEditionAdapter {
  private readonly logger = new Logger(WhiskyEditionAdapter.name);

  async fetchAll(): Promise<WhiskyEditionReview[]> {
    const all: WhiskyEditionReview[] = [];
    let total = Infinity;
    for (let page = 1; page <= MAX_PAGES && all.length < total; page++) {
      let json: any;
      try {
        const res = await fetch(`${BASE_URL}/whisky-reviews?page=${page}&per_page=${PER_PAGE}`);
        if (!res.ok) {
          this.logger.error(`WHISKY:EDITION page ${page} failed with status ${res.status}`);
          break;
        }
        json = await res.json();
      } catch (err) {
        this.logger.error(`WHISKY:EDITION page ${page} fetch threw: ${err}`);
        break;
      }
      const items: WhiskyEditionReview[] = json?.items ?? [];
      if (typeof json?.total === 'number') total = json.total;
      if (items.length === 0) break;
      all.push(...items);
      if (items.length < PER_PAGE) break;
    }
    return all;
  }
}
