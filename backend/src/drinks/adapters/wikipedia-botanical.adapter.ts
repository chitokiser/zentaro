import { Injectable, Logger } from '@nestjs/common';

// Wikipedia's REST summary API — free, no key. TheCocktailDB's ingredient list
// (used elsewhere in this module) is a generic cocktail-ingredient list dominated
// by brand-name spirits and mixers, not botanicals, so it can't populate a real
// botanical database on its own. This adapter instead pulls real, verified
// descriptions and images for a curated list of actual gin/spirit botanicals —
// each entry below was checked live against the real Wikipedia REST API before
// being added, and its `wikipediaTitle` is the exact confirmed article slug.
export interface CuratedBotanical {
  name: string;
  wikipediaTitle: string;
  botanicalCategory: string;
}

export const CURATED_BOTANICALS: CuratedBotanical[] = [
  {
    name: 'Juniper Berry',
    wikipediaTitle: 'Juniper_berry',
    botanicalCategory: 'Berry',
  },
  {
    name: 'Coriander Seed',
    wikipediaTitle: 'Coriander',
    botanicalCategory: 'Seed',
  },
  {
    name: 'Angelica Root',
    wikipediaTitle: 'Angelica_archangelica',
    botanicalCategory: 'Root',
  },
  {
    name: 'Lemongrass',
    wikipediaTitle: 'Lemongrass',
    botanicalCategory: 'Herb',
  },
  { name: 'Cinnamon', wikipediaTitle: 'Cinnamon', botanicalCategory: 'Bark' },
  {
    name: 'Cassia Bark',
    wikipediaTitle: 'Cinnamomum_cassia',
    botanicalCategory: 'Bark',
  },
  {
    name: 'Star Anise',
    wikipediaTitle: 'Star_anise',
    botanicalCategory: 'Seed',
  },
  { name: 'Ginger', wikipediaTitle: 'Ginger', botanicalCategory: 'Root' },
  { name: 'Yuzu Peel', wikipediaTitle: 'Yuzu', botanicalCategory: 'Peel' },
  {
    name: 'Orris Root',
    wikipediaTitle: 'Orris_root',
    botanicalCategory: 'Root',
  },
  { name: 'Cardamom', wikipediaTitle: 'Cardamom', botanicalCategory: 'Seed' },
  {
    name: 'Licorice Root',
    wikipediaTitle: 'Liquorice',
    botanicalCategory: 'Root',
  },
  {
    name: 'Grains of Paradise',
    wikipediaTitle: 'Grains_of_paradise',
    botanicalCategory: 'Seed',
  },
  { name: 'Cubeb Pepper', wikipediaTitle: 'Cubeb', botanicalCategory: 'Fruit' },
  {
    name: 'Sichuan Pepper',
    wikipediaTitle: 'Sichuan_pepper',
    botanicalCategory: 'Fruit',
  },
  {
    name: 'Chamomile',
    wikipediaTitle: 'Chamomile',
    botanicalCategory: 'Flower',
  },
  { name: 'Lavender', wikipediaTitle: 'Lavender', botanicalCategory: 'Flower' },
  {
    name: 'Elderflower',
    wikipediaTitle: 'Sambucus_nigra',
    botanicalCategory: 'Flower',
  },
  { name: 'Rosemary', wikipediaTitle: 'Rosemary', botanicalCategory: 'Herb' },
  { name: 'Thyme', wikipediaTitle: 'Thyme', botanicalCategory: 'Herb' },
  { name: 'Basil', wikipediaTitle: 'Basil', botanicalCategory: 'Herb' },
  { name: 'Mint', wikipediaTitle: 'Mentha', botanicalCategory: 'Herb' },
  { name: 'Fennel Seed', wikipediaTitle: 'Fennel', botanicalCategory: 'Seed' },
  { name: 'Nutmeg', wikipediaTitle: 'Nutmeg', botanicalCategory: 'Seed' },
  { name: 'Clove', wikipediaTitle: 'Clove', botanicalCategory: 'Flower Bud' },
  {
    name: 'Allspice',
    wikipediaTitle: 'Pimenta_dioica',
    botanicalCategory: 'Berry',
  },
  { name: 'Vanilla', wikipediaTitle: 'Vanilla', botanicalCategory: 'Pod' },
  {
    name: 'Sarsaparilla',
    wikipediaTitle: 'Smilax_ornata',
    botanicalCategory: 'Root',
  },
  {
    name: 'Wormwood',
    wikipediaTitle: 'Artemisia_absinthium',
    botanicalCategory: 'Herb',
  },
  {
    name: 'Hyssop',
    wikipediaTitle: 'Hyssopus_officinalis',
    botanicalCategory: 'Herb',
  },
  {
    name: 'Lemon Balm',
    wikipediaTitle: 'Melissa_officinalis',
    botanicalCategory: 'Herb',
  },
  {
    name: 'Orange Peel',
    wikipediaTitle: 'Orange_(fruit)',
    botanicalCategory: 'Peel',
  },
  { name: 'Lemon Peel', wikipediaTitle: 'Lemon', botanicalCategory: 'Peel' },
  {
    name: 'Lime Peel',
    wikipediaTitle: 'Lime_(fruit)',
    botanicalCategory: 'Peel',
  },
  { name: 'Bay Leaf', wikipediaTitle: 'Bay_leaf', botanicalCategory: 'Leaf' },
  {
    name: 'Caraway Seed',
    wikipediaTitle: 'Caraway',
    botanicalCategory: 'Seed',
  },
  { name: 'Dill Seed', wikipediaTitle: 'Dill', botanicalCategory: 'Seed' },
  {
    name: 'Anise Seed',
    wikipediaTitle: 'Pimpinella_anisum',
    botanicalCategory: 'Seed',
  },
  {
    name: 'Gentian Root',
    wikipediaTitle: 'Gentiana_lutea',
    botanicalCategory: 'Root',
  },
  {
    name: 'Rhubarb Root',
    wikipediaTitle: 'Rheum_rhabarbarum',
    botanicalCategory: 'Root',
  },
  {
    name: 'Cascarilla Bark',
    wikipediaTitle: 'Cascarilla',
    botanicalCategory: 'Bark',
  },
  {
    name: 'Quassia',
    wikipediaTitle: 'Quassia_amara',
    botanicalCategory: 'Bark',
  },
  {
    name: 'Cinchona Bark',
    wikipediaTitle: 'Cinchona',
    botanicalCategory: 'Bark',
  },
  {
    name: 'Sweet Woodruff',
    wikipediaTitle: 'Galium_odoratum',
    botanicalCategory: 'Herb',
  },
  { name: 'Rose Petal', wikipediaTitle: 'Rose', botanicalCategory: 'Flower' },
  {
    name: 'Hibiscus',
    wikipediaTitle: 'Hibiscus_sabdariffa',
    botanicalCategory: 'Flower',
  },
  { name: 'Saffron', wikipediaTitle: 'Saffron', botanicalCategory: 'Flower' },
  { name: 'Turmeric', wikipediaTitle: 'Turmeric', botanicalCategory: 'Root' },
  {
    name: 'Black Pepper',
    wikipediaTitle: 'Black_pepper',
    botanicalCategory: 'Seed',
  },
  {
    name: 'Pink Peppercorn',
    wikipediaTitle: 'Schinus_molle',
    botanicalCategory: 'Berry',
  },
  {
    name: 'Grapefruit Peel',
    wikipediaTitle: 'Grapefruit',
    botanicalCategory: 'Peel',
  },
  {
    name: 'Bergamot Orange',
    wikipediaTitle: 'Citrus_bergamia',
    botanicalCategory: 'Peel',
  },
  {
    name: 'Sage',
    wikipediaTitle: 'Salvia_officinalis',
    botanicalCategory: 'Herb',
  },
  { name: 'Tarragon', wikipediaTitle: 'Tarragon', botanicalCategory: 'Herb' },
  {
    name: 'Calamus Root',
    wikipediaTitle: 'Acorus_calamus',
    botanicalCategory: 'Root',
  },
  {
    name: 'Galangal',
    wikipediaTitle: 'Alpinia_galanga',
    botanicalCategory: 'Root',
  },
  {
    name: 'Bison Grass',
    wikipediaTitle: 'Hierochloe_odorata',
    botanicalCategory: 'Herb',
  },
  {
    name: 'Sassafras',
    wikipediaTitle: 'Sassafras_albidum',
    botanicalCategory: 'Root',
  },
  { name: 'Kola Nut', wikipediaTitle: 'Kola_nut', botanicalCategory: 'Seed' },
  { name: 'Vetiver', wikipediaTitle: 'Vetiver', botanicalCategory: 'Root' },
  {
    name: 'Elecampane',
    wikipediaTitle: 'Inula_helenium',
    botanicalCategory: 'Root',
  },
  { name: 'Myrrh', wikipediaTitle: 'Myrrh', botanicalCategory: 'Resin' },
  {
    name: 'Frankincense',
    wikipediaTitle: 'Frankincense',
    botanicalCategory: 'Resin',
  },
  { name: 'Damiana', wikipediaTitle: 'Damiana', botanicalCategory: 'Herb' },
];

const USER_AGENT =
  'ZentaroDrinksBot/1.0 (https://zentaro.netlify.app; phuclochd8386@gmail.com)';

export interface WikipediaBotanicalSummary {
  title: string;
  extract: string | null;
  imageUrl: string | null;
  pageUrl: string | null;
}

@Injectable()
export class WikipediaBotanicalAdapter {
  private readonly logger = new Logger(WikipediaBotanicalAdapter.name);

  async fetchSummary(
    wikipediaTitle: string,
  ): Promise<WikipediaBotanicalSummary | null> {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${wikipediaTitle}`,
        {
          headers: { 'User-Agent': USER_AGENT },
        },
      );
      if (!res.ok) {
        this.logger.error(
          `Wikipedia summary for "${wikipediaTitle}" failed with HTTP ${res.status}`,
        );
        return null;
      }
      const json: any = await res.json();
      return {
        title: json.title ?? wikipediaTitle,
        extract: json.extract ?? null,
        imageUrl: json.thumbnail?.source ?? null,
        pageUrl:
          json.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${wikipediaTitle}`,
      };
    } catch (err) {
      this.logger.error(
        `Wikipedia summary for "${wikipediaTitle}" threw: ${err}`,
      );
      return null;
    }
  }

  async fetchAll(): Promise<
    { botanical: CuratedBotanical; summary: WikipediaBotanicalSummary | null }[]
  > {
    const results: {
      botanical: CuratedBotanical;
      summary: WikipediaBotanicalSummary | null;
    }[] = [];
    for (const botanical of CURATED_BOTANICALS) {
      const summary = await this.fetchSummary(botanical.wikipediaTitle);
      results.push({ botanical, summary });
    }
    return results;
  }
}
