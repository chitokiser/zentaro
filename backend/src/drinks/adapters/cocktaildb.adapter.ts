import { Injectable, Logger } from '@nestjs/common';

// Free/test API key "1" — TheCocktailDB explicitly documents this as the shared
// free-tier key (search/lookup/list/random endpoints). Bulk "most popular"/"latest"
// endpoints require a paid Patreon key and are intentionally not used here.
const BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export interface CocktailDbDrink {
  idDrink: string;
  strDrink: string;
  strCategory?: string | null;
  strAlcoholic?: string | null;
  strGlass?: string | null;
  strInstructions?: string | null;
  strDrinkThumb?: string | null;
  strTags?: string | null;
  [ingredientKey: string]: string | null | undefined;
}

export interface CocktailDbIngredient {
  idIngredient: string;
  strIngredient: string;
  strDescription?: string | null;
  strType?: string | null;
  strAlcohol?: string | null;
  strABV?: string | null;
}

@Injectable()
export class CocktailDbAdapter {
  private readonly logger = new Logger(CocktailDbAdapter.name);

  async fetchAllDrinks(): Promise<CocktailDbDrink[]> {
    const all: CocktailDbDrink[] = [];
    for (const letter of ALPHABET) {
      try {
        const res = await fetch(`${BASE_URL}/search.php?f=${letter}`);
        if (!res.ok) {
          this.logger.error(`TheCocktailDB letter "${letter}" failed with status ${res.status}`);
          continue;
        }
        const json: any = await res.json();
        if (Array.isArray(json?.drinks)) {
          all.push(...json.drinks);
        }
      } catch (err) {
        this.logger.error(`TheCocktailDB letter "${letter}" fetch threw: ${err}`);
      }
    }
    return all;
  }

  async fetchIngredientNames(): Promise<string[]> {
    try {
      const res = await fetch(`${BASE_URL}/list.php?i=list`);
      if (!res.ok) {
        this.logger.error(`TheCocktailDB ingredient list failed with status ${res.status}`);
        return [];
      }
      const json: any = await res.json();
      const rows: Array<{ strIngredient1: string }> = json?.drinks ?? [];
      return rows.map((r) => r.strIngredient1).filter(Boolean);
    } catch (err) {
      this.logger.error(`TheCocktailDB ingredient list fetch threw: ${err}`);
      return [];
    }
  }

  async fetchIngredientDetail(name: string): Promise<CocktailDbIngredient | null> {
    try {
      const res = await fetch(`${BASE_URL}/search.php?i=${encodeURIComponent(name)}`);
      if (!res.ok) return null;
      const json: any = await res.json();
      const rows: CocktailDbIngredient[] = json?.ingredients ?? [];
      return rows[0] ?? null;
    } catch (err) {
      this.logger.error(`TheCocktailDB ingredient detail "${name}" fetch threw: ${err}`);
      return null;
    }
  }
}
