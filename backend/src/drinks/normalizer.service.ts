import { Injectable } from '@nestjs/common';
import { slugify } from './slugify';
import type { WhiskyEditionReview } from './adapters/whisky-edition.adapter';
import type { CocktailDbDrink, CocktailDbIngredient } from './adapters/cocktaildb.adapter';

// Curated from the request spec's own botanical examples (§9) plus common gin/spirit
// botanicals — TheCocktailDB has no "is this a botanical" field, so this is an admin-style
// curation applied deterministically to real ingredient names, not an inferred/guessed fact.
const KNOWN_BOTANICAL_NAMES = new Set(
  [
    'coriander seed', 'coriander', 'angelica root', 'angelica', 'lemongrass', 'cinnamon',
    'star anise', 'juniper', 'juniper berries', 'ginger', 'yuzu peel', 'yuzu', 'orris root',
    'cardamom', 'cassia bark', 'liquorice root', 'licorice root', 'grains of paradise',
    'orange peel', 'lemon peel', 'lime peel', 'cubeb pepper', 'sichuan pepper',
    'chamomile', 'lavender', 'elderflower', 'rosemary', 'thyme', 'basil', 'mint',
    'fennel seed', 'nutmeg', 'clove', 'allspice', 'vanilla', 'sarsaparilla',
  ].map((n) => n.toLowerCase()),
);

function averageWhiskyEditionRating(rating: WhiskyEditionReview['rating']): { rating: number; ratingCount: number } | null {
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
      imageUrl: raw.image?.url ? new URL(raw.image.url, 'https://thewhiskyedition.com').toString() : null,
      sourceUrl: raw.url ? new URL(raw.url, 'https://thewhiskyedition.com').toString() : null,
      sourceLicense: 'CC-BY-4.0',
      externalRatings: externalRating
        ? [{ source: 'whisky-edition', rating: externalRating.rating, ratingCount: externalRating.ratingCount }]
        : [],
      aroma: [] as string[],
      taste: [] as string[],
      finish: null as string | null,
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
        ingredients.push({ name: String(name).trim(), measure: measure ? String(measure).trim() : null });
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
      tags: raw.strTags ? raw.strTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      ingredients,
      ingredientNames: ingredients.map((i) => i.name.toLowerCase()),
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
      sourceUrl: null as string | null,
      sourceLicense: 'TheCocktailDB free API (attribution)',
    };
  }
}
