import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

const SEARCH_SCAN_LIMIT = 2000;

// TheCocktailDB ingredient names are generic spirit terms ("Gin", "Whiskey", "Rum", ...),
// not specific bottlings — so "related cocktails" for a spirit product matches on whichever
// of these generic terms appears in the product's name/subcategory, not an exact ingredient
// name match (a single-malt review will never literally be a cocktail ingredient name).
const SPIRIT_KEYWORDS = [
  'gin', 'vodka', 'rum', 'tequila', 'mezcal', 'whisky', 'whiskey', 'bourbon', 'rye',
  'scotch', 'brandy', 'cognac', 'absinthe', 'liqueur',
];

function findSpiritKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  return SPIRIT_KEYWORDS.find((kw) => lower.includes(kw)) ?? null;
}

function matchesQuery(haystack: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((field) => field && field.toLowerCase().includes(q));
}

@Injectable()
export class DrinksService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private productsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_DRINKS_PRODUCTS);
  }
  private cocktailsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_DRINKS_COCKTAILS);
  }
  private ingredientsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_DRINKS_INGREDIENTS);
  }

  /**
   * Firestore has no full-text search, so this is a bounded field-match scan
   * (name/producer/country/subCategory/category) across products, cocktails,
   * and ingredients — sufficient for the current dataset size (low thousands).
   * A dedicated search index (Algolia etc.) is a Phase 2 concern once volume
   * outgrows this.
   */
  async search(query: string, filters: { category?: string; country?: string; minAbv?: number; maxAbv?: number }) {
    const [productsSnap, cocktailsSnap, ingredientsSnap] = await Promise.all([
      this.productsCol().limit(SEARCH_SCAN_LIMIT).get(),
      this.cocktailsCol().limit(SEARCH_SCAN_LIMIT).get(),
      this.ingredientsCol().limit(SEARCH_SCAN_LIMIT).get(),
    ]);

    const products = productsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as any)
      .filter((p) => matchesQuery([p.name, p.producerName, p.country, p.subCategory, p.category], query))
      .filter((p) => !filters.category || p.category === filters.category)
      .filter((p) => !filters.country || (p.country ?? '').toLowerCase() === filters.country.toLowerCase())
      .filter((p) => filters.minAbv == null || (p.abv != null && p.abv >= filters.minAbv))
      .filter((p) => filters.maxAbv == null || (p.abv != null && p.abv <= filters.maxAbv));

    const cocktails = cocktailsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as any)
      .filter((c) => matchesQuery([c.name, c.category, ...(c.ingredientNames ?? [])], query));

    const ingredients = ingredientsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as any)
      .filter((i) => matchesQuery([i.name, i.type], query));

    return { products, cocktails, ingredients };
  }

  async getProductBySlug(slug: string) {
    const doc = await this.productsCol().doc(slug).get();
    if (!doc.exists) throw new NotFoundException('Drink not found');
    const product = { id: doc.id, ...doc.data() } as any;

    const keyword = findSpiritKeyword(`${product.name} ${product.subCategory ?? ''}`);
    const relatedCocktails = keyword ? await this.findCocktailsByIngredientName(keyword) : [];

    return { product, relatedCocktails };
  }

  async getCocktailById(id: string) {
    const doc = await this.cocktailsCol().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Cocktail not found');
    return { id: doc.id, ...doc.data() };
  }

  async getIngredientBySlug(slug: string) {
    const doc = await this.ingredientsCol().doc(slug).get();
    if (!doc.exists) throw new NotFoundException('Ingredient not found');
    const ingredient = { id: doc.id, ...doc.data() } as any;
    const relatedCocktails = await this.findCocktailsByIngredientName(ingredient.name);
    return { ingredient, relatedCocktails };
  }

  async listIngredients(isBotanical?: boolean) {
    let query: FirebaseFirestore.Query = this.ingredientsCol();
    if (isBotanical !== undefined) {
      query = query.where('isBotanical', '==', isBotanical);
    }
    const snap = await query.limit(1000).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  private async findCocktailsByIngredientName(name: string) {
    const snap = await this.cocktailsCol()
      .where('ingredientNames', 'array-contains', name.trim().toLowerCase())
      .limit(24)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async listRankings(tab: string, category?: string) {
    let query: FirebaseFirestore.Query = this.productsCol();
    if (category) query = query.where('category', '==', category);
    const snap = await query.limit(1000).get();
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any).filter((p) => p.weightedRating != null);

    switch (tab) {
      case 'most-reviewed':
        items.sort((a, b) => (b.externalRatings?.[0]?.ratingCount ?? 0) - (a.externalRatings?.[0]?.ratingCount ?? 0));
        break;
      case 'new-releases':
        items.sort((a, b) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
        break;
      case 'top-rated':
      default:
        items.sort((a, b) => (b.weightedRating ?? 0) - (a.weightedRating ?? 0));
        break;
    }
    return items.slice(0, 50);
  }

  async listByCountry(country: string) {
    const snap = await this.productsCol().limit(2000).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as any)
      .filter((p) => (p.country ?? '').toLowerCase() === country.toLowerCase());
  }

  async getStatistics() {
    const [productsSnap, cocktailsSnap, ingredientsSnap, sourcesSnap] = await Promise.all([
      this.productsCol().get(),
      this.cocktailsCol().get(),
      this.ingredientsCol().get(),
      this.db.collection(COLLECTIONS.ZENTARO_DRINKS_SOURCES).get(),
    ]);

    const countries = new Set<string>();
    const producers = new Set<string>();
    let newThisMonth = 0;
    const now = new Date();
    productsSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.country) countries.add(data.country);
      if (data.producerName) producers.add(data.producerName);
      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()) {
        newThisMonth += 1;
      }
    });

    const botanicalsCount = ingredientsSnap.docs.filter((d) => d.data().isBotanical === true).length;
    const lastSyncedAt = sourcesSnap.docs
      .map((d) => d.data().lastSyncedAt?.toDate?.())
      .filter(Boolean)
      .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];

    return {
      totalProducts: productsSnap.size,
      totalCountries: countries.size,
      totalProducers: producers.size,
      totalIngredients: ingredientsSnap.size,
      totalBotanicals: botanicalsCount,
      totalCocktails: cocktailsSnap.size,
      newProductsThisMonth: newThisMonth,
      lastUpdated: lastSyncedAt ?? null,
    };
  }

  async listSyncLogs() {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_DRINKS_SYNC_LOGS)
      .orderBy('completedAt', 'desc')
      .limit(20)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async listMergeCandidates() {
    const snap = await this.productsCol().orderBy('mergeCandidateOf').limit(200).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as any)
      .filter((p) => p.mergeCandidateOf);
  }

  /** Admin-curated botanicals/ingredients — the spec's §19 fallback priority "5. 관리자 직접 입력" for data no verified API provides. */
  async createIngredientAdmin(input: {
    name: string;
    description?: string;
    isBotanical: boolean;
    botanicalCategory?: string;
  }) {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const ref = this.ingredientsCol().doc(slug || `ingredient-${Date.now()}`);
    await ref.set({
      source: 'admin',
      externalId: null,
      name: input.name,
      slug: ref.id,
      type: null,
      description: input.description ?? null,
      alcoholic: false,
      abv: null,
      isBotanical: input.isBotanical,
      botanicalCategory: input.botanicalCategory ?? null,
      sourceUrl: null,
      sourceLicense: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id };
  }

  async updateIngredientAdmin(
    id: string,
    patch: Partial<{ name: string; description: string; isBotanical: boolean; botanicalCategory: string }>,
  ) {
    const ref = this.ingredientsCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Ingredient not found');
    await ref.set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { id };
  }

  async deleteIngredientAdmin(id: string) {
    await this.ingredientsCol().doc(id).delete();
    return { id };
  }

  async rateProduct(uid: string, slug: string, rating: number) {
    const productRef = this.productsCol().doc(slug);
    const ratingRef = this.db.collection(COLLECTIONS.ZENTARO_DRINKS_USER_RATINGS).doc(`${uid}_${slug}`);

    await this.db.runTransaction(async (tx) => {
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists) throw new NotFoundException('Drink not found');
      const existingRatingSnap = await tx.get(ratingRef);

      const product = productSnap.data()!;
      const prevCount: number = product.zentaroRatingCount ?? 0;
      const prevAvg: number = product.zentaroRating ?? 0;

      let newCount = prevCount;
      let newSum = prevAvg * prevCount;
      if (existingRatingSnap.exists) {
        newSum = newSum - (existingRatingSnap.data()!.rating as number) + rating;
      } else {
        newSum += rating;
        newCount += 1;
      }
      const newAvg = newCount > 0 ? newSum / newCount : 0;

      tx.set(ratingRef, { uid, productId: slug, rating, updatedAt: FieldValue.serverTimestamp() });
      tx.update(productRef, {
        zentaroRating: Math.round(newAvg * 100) / 100,
        zentaroRatingCount: newCount,
      });
    });

    return { ok: true };
  }
}
