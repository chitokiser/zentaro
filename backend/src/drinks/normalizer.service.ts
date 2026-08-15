import { Injectable } from '@nestjs/common';
import { slugify } from './slugify';
import type { WhiskyEditionReview } from './adapters/whisky-edition.adapter';
import type {
  CocktailDbDrink,
  CocktailDbIngredient,
} from './adapters/cocktaildb.adapter';
import type { Beer9Item } from './adapters/beer9.adapter';
import type { OpenBreweryDbBrewery } from './adapters/open-brewery-db.adapter';
import type { WikidataProducerRaw } from './adapters/wikidata.adapter';
import type {
  CuratedBotanical,
  WikipediaBotanicalSummary,
} from './adapters/wikipedia-botanical.adapter';
import type { TastyRecipeRaw } from './adapters/tasty.adapter';

function parsePercent(value: string | undefined | null): number | null {
  if (!value) return null;
  const n = Number(String(value).replace('%', '').trim());
  return Number.isFinite(n) ? n : null;
}

function splitCommaList(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

// Curated from the request spec's own botanical examples (§9) plus common gin/spirit
// botanicals — TheCocktailDB has no "is this a botanical" field, so this is an admin-style
// curation applied deterministically to real ingredient names, not an inferred/guessed fact.
const KNOWN_BOTANICAL_NAMES = new Set(
  [
    'coriander seed',
    'coriander',
    'angelica root',
    'angelica',
    'lemongrass',
    'cinnamon',
    'star anise',
    'juniper',
    'juniper berries',
    'ginger',
    'yuzu peel',
    'yuzu',
    'orris root',
    'cardamom',
    'cassia bark',
    'liquorice root',
    'licorice root',
    'grains of paradise',
    'orange peel',
    'lemon peel',
    'lime peel',
    'cubeb pepper',
    'sichuan pepper',
    'chamomile',
    'lavender',
    'elderflower',
    'rosemary',
    'thyme',
    'basil',
    'mint',
    'fennel seed',
    'nutmeg',
    'clove',
    'allspice',
    'vanilla',
    'sarsaparilla',
  ].map((n) => n.toLowerCase()),
);

function averageWhiskyEditionRating(
  rating: WhiskyEditionReview['rating'],
): { rating: number; ratingCount: number } | null {
  if (!rating) return null;
  const nums = Object.entries(rating)
    .filter(([key]) => key !== 'value_for_money')
    .map(([, v]) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (nums.length === 0) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return { rating: Math.round(avg * 10) / 10, ratingCount: nums.length };
}

@Injectable()
export class DrinksNormalizerService {
  normalizeWhiskyEditionProduct(raw: WhiskyEditionReview) {
    const externalRating = averageWhiskyEditionRating(raw.rating);
    const meta = raw.metadata ?? {};
    return {
      source: 'whisky-edition',
      externalId: String(raw.id),
      name: raw.name,
      slug: `whisky-edition-${slugify(raw.slug || raw.name)}`,
      category: 'spirit' as const,
      subCategory: meta.type ?? null,
      country: meta.country ?? null,
      region: meta.region ?? null,
      producerName: meta.distillery ?? meta.bottler ?? null,
      abv: typeof meta.abv === 'number' ? meta.abv : null,
      age: typeof meta.age === 'number' ? meta.age : null,
      bottleSize: null,
      vintage: null,
      description: raw.description ?? null,
      imageUrl: raw.image?.url
        ? new URL(raw.image.url, 'https://thewhiskyedition.com').toString()
        : null,
      sourceUrl: raw.url
        ? new URL(raw.url, 'https://thewhiskyedition.com').toString()
        : null,
      sourceLicense: 'CC-BY-4.0',
      externalRatings: externalRating
        ? [
            {
              source: 'whisky-edition',
              rating: externalRating.rating,
              ratingCount: externalRating.ratingCount,
            },
          ]
        : [],
      aroma: [] as string[],
      taste: [] as string[],
      finish: null as string | null,
      foodPairing: [] as string[],
      isZentaroProduct: false,
      ingredientNames: [] as string[],
    };
  }

  /**
   * Beer9's `rating` field is almost always blank in practice and its docs don't state a scale
   * (0-5? 0-10? 0-100?) — guessing would misrepresent it as a real score, so it's intentionally
   * left out of externalRatings rather than assumed. `tasting_notes`/`food_pairing` are genuine
   * comma-separated fields the API returns, split the same deterministic way TheCocktailDB's
   * `strTags` already is above — not an inferred/guessed taxonomy.
   */
  normalizeBeer9Product(raw: Beer9Item) {
    return {
      source: 'beer9',
      externalId: raw.sku,
      name: raw.name,
      slug: `beer9-${slugify(raw.name)}-${raw.sku}`,
      category: 'beer' as const,
      subCategory: raw.sub_category_2 || raw.sub_category_1 || null,
      country: raw.country || null,
      region: raw.region || null,
      producerName: raw.brewery || null,
      abv: parsePercent(raw.abv),
      age: null as number | null,
      bottleSize: null,
      vintage: null,
      description: raw.description || null,
      imageUrl: null as string | null,
      sourceUrl: null as string | null,
      sourceLicense: 'RapidAPI Beer9 (subscription required)',
      externalRatings: [] as {
        source: string;
        rating: number;
        ratingCount: number;
      }[],
      aroma: [] as string[],
      taste: splitCommaList(raw.tasting_notes),
      finish: null as string | null,
      foodPairing: splitCommaList(raw.food_pairing),
      isZentaroProduct: false,
      ingredientNames: [] as string[],
    };
  }

  normalizeCocktail(raw: CocktailDbDrink) {
    const ingredients: { name: string; measure: string | null }[] = [];
    for (let i = 1; i <= 15; i++) {
      const name = raw[`strIngredient${i}`];
      const measure = raw[`strMeasure${i}`];
      if (name && String(name).trim()) {
        ingredients.push({
          name: String(name).trim(),
          measure: measure ? String(measure).trim() : null,
        });
      }
    }
    return {
      source: 'thecocktaildb',
      externalId: raw.idDrink,
      name: raw.strDrink,
      slug: `cocktail-${slugify(raw.strDrink)}-${raw.idDrink}`,
      category: raw.strCategory ?? null,
      alcoholic: raw.strAlcoholic ?? null,
      glass: raw.strGlass ?? null,
      instructions: raw.strInstructions ?? null,
      imageUrl: raw.strDrinkThumb ?? null,
      sourceUrl: `https://www.thecocktaildb.com/drink/${raw.idDrink}-${slugify(raw.strDrink)}`,
      sourceLicense: 'TheCocktailDB free API (attribution)',
      tags: raw.strTags
        ? raw.strTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      ingredients,
      ingredientNames: ingredients.map((i) => i.name.toLowerCase()),
    };
  }

  /** Open Brewery DB is breweries only — no distillery data — so producerType is always fixed. */
  normalizeOpenBreweryDbProducer(raw: OpenBreweryDbBrewery) {
    const lat = raw.latitude ? Number(raw.latitude) : null;
    const lng = raw.longitude ? Number(raw.longitude) : null;
    return {
      source: 'openbrewerydb',
      externalId: raw.id,
      name: raw.name,
      slug: `openbrewerydb-${slugify(raw.name)}-${raw.id.slice(0, 8)}`,
      producerType: 'brewery' as const,
      country: raw.country || null,
      region: raw.state_province || null,
      city: raw.city || null,
      address: raw.address_1 || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      website: raw.website_url || null,
      foundedYear: null as number | null,
      description: null as string | null,
      sourceUrl: null as string | null,
      sourceLicense: 'Open Brewery DB (openbrewerydb.org, free API)',
    };
  }

  /**
   * Wikidata field completeness varies wildly by item — some entries have full
   * coordinates/website/founding year, most have only a name and country.
   * Missing fields are left null, never guessed or backfilled.
   */
  normalizeWikidataProducer(
    raw: WikidataProducerRaw,
    producerType: 'brewery' | 'distillery',
  ) {
    return {
      source: 'wikidata',
      externalId: raw.qid,
      name: raw.name,
      slug: `wikidata-${slugify(raw.name)}-${raw.qid.toLowerCase()}`,
      producerType,
      country: raw.country,
      region: null as string | null,
      city: null as string | null,
      address: null as string | null,
      lat: raw.lat,
      lng: raw.lng,
      website: raw.website,
      foundedYear: raw.inceptionYear,
      description: null as string | null,
      sourceUrl: `https://www.wikidata.org/wiki/${raw.qid}`,
      sourceLicense: 'Wikidata (CC0)',
    };
  }

  normalizeIngredient(raw: CocktailDbIngredient) {
    const name = raw.strIngredient;
    const isBotanical = KNOWN_BOTANICAL_NAMES.has(name.trim().toLowerCase());
    return {
      source: 'thecocktaildb',
      externalId: raw.idIngredient,
      name,
      slug: slugify(name),
      type: raw.strType ?? null,
      description: raw.strDescription ?? null,
      alcoholic: raw.strAlcohol === 'Yes',
      abv: raw.strABV ? Number(raw.strABV) : null,
      isBotanical,
      botanicalCategory: null as string | null,
      imageUrl: null as string | null,
      sourceUrl: null as string | null,
      sourceLicense: 'TheCocktailDB free API (attribution)',
    };
  }

  /**
   * TheCocktailDB's ingredient list (normalizeIngredient above) is generic cocktail
   * ingredients — mostly brand-name spirits and mixers — so almost none of it is an
   * actual botanical. This normalizes the curated, Wikipedia-verified botanical list
   * instead (see wikipedia-botanical.adapter.ts for how each entry was verified).
   * Falls back to a null description/image if Wikipedia's summary fetch failed for
   * that entry, rather than ever guessing content.
   */
  normalizeWikipediaBotanical(
    botanical: CuratedBotanical,
    summary: WikipediaBotanicalSummary | null,
  ) {
    return {
      source: 'wikipedia',
      externalId: botanical.wikipediaTitle,
      name: botanical.name,
      slug: slugify(botanical.name),
      type: 'Botanical',
      description: summary?.extract ?? null,
      alcoholic: false,
      abv: null as number | null,
      isBotanical: true,
      botanicalCategory: botanical.botanicalCategory,
      imageUrl: summary?.imageUrl ?? null,
      sourceUrl:
        summary?.pageUrl ??
        `https://en.wikipedia.org/wiki/${botanical.wikipediaTitle}`,
      sourceLicense: 'Wikipedia (CC BY-SA 4.0)',
    };
  }

  /**
   * Tasty recipes matched to a ZENTARO product for "pairs well with" suggestions.
   * `productSlug` links back to the static product it was fetched for — see
   * FOOD_PAIRING_TAGS in the products page for the real Tasty tag names queried
   * per product.
   */
  normalizeTastyRecipe(raw: TastyRecipeRaw, productSlug: string) {
    return {
      source: 'tasty',
      externalId: String(raw.id),
      productSlug,
      name: raw.name,
      slug: raw.slug,
      description: raw.description ?? null,
      imageUrl: raw.thumbnail_url ?? null,
      totalTimeMinutes: raw.total_time_minutes ?? null,
      servings: raw.num_servings ?? null,
      ratingScore: raw.user_ratings?.score ?? null,
      tags: raw.tags.map((t) => t.display_name),
      sourceUrl: `https://tasty.co/recipe/${raw.slug}`,
      sourceLicense: 'Tasty (BuzzFeed) via RapidAPI',
    };
  }
}
