import { Injectable, Logger } from '@nestjs/common';

// RapidAPI "Tasty" (BuzzFeed) — general food-recipe database, used here for
// food-pairing suggestions on ZENTARO's own product pages. Shares the same
// RapidAPI account key as Beer9Adapter (BEER9_API_KEY). Response shape below
// is transcribed from a real, live `recipes/list` call made through the
// project's own RapidAPI subscription — not guessed.
const BASE_URL = 'https://tasty.p.rapidapi.com/recipes/list';
const HOST = 'tasty.p.rapidapi.com';

export interface TastyTag {
  id: number;
  name: string;
  display_name: string;
  type: string;
  root_tag_type: string;
  parent_tag_name: string | null;
}

export interface TastyIngredientComponent {
  raw_text: string;
  position: number;
}

export interface TastyRecipeRaw {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  num_servings: number | null;
  nutrition: {
    calories: number | null;
    carbohydrates: number | null;
    fat: number | null;
    fiber: number | null;
    protein: number | null;
    sugar: number | null;
  } | null;
  user_ratings: {
    score: number | null;
    count_positive: number;
    count_negative: number;
  } | null;
  tags: TastyTag[];
  sections: {
    components: {
      raw_text: string;
      position: number;
    }[];
  }[];
}

interface TastyRecipesListResponse {
  count: number;
  results: TastyRecipeRaw[];
}

@Injectable()
export class TastyAdapter {
  private readonly logger = new Logger(TastyAdapter.name);

  /** Fetches one page of recipes matching the given real Tasty tag names (e.g. "dinner", "north_american"). */
  async fetchRecipesByTags(
    tags: string[],
    size: number,
  ): Promise<TastyRecipeRaw[]> {
    const apiKey = process.env.BEER9_API_KEY;
    if (!apiKey) {
      throw new Error('BEER9_API_KEY is not configured');
    }

    const url = `${BASE_URL}?from=0&size=${size}&tags=${encodeURIComponent(tags.join(','))}`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': HOST,
          'x-rapidapi-key': apiKey,
        },
      });
    } catch (err) {
      this.logger.error(`Tasty recipes/list fetch threw: ${err}`);
      return [];
    }

    if (!res.ok) {
      this.logger.error(
        `Tasty recipes/list failed with HTTP ${res.status} for tags "${tags.join(',')}"`,
      );
      return [];
    }

    const json: TastyRecipesListResponse = await res.json();
    return json.results ?? [];
  }
}
