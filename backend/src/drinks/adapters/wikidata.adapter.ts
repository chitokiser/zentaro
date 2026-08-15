import { Injectable, Logger } from '@nestjs/common';

// Wikidata Query Service — free, no API key. Wikidata's usage policy asks for a
// descriptive User-Agent identifying the app, so requests aren't dropped as
// anonymous bot traffic. Not run on the daily cron — one-time catalog pull
// triggered from /admin/drinks, same pattern as Beer9Adapter/OpenBreweryDbAdapter.
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'ZentaroDrinksBot/1.0 (https://zentaro.netlify.app; phuclochd8386@gmail.com)';

// Q1251750 = distillery, Q131734 = brewery. Verified live against Wikidata (both the
// QID -> label and a known real-world example — Glenfiddich Distillery's own P31 claim
// resolves to a subclass of Q1251750, not to Q1251750 directly, which is why the query
// below matches transitively via P279* rather than a direct P31 equality).
const WIKIDATA_TYPE_QIDS: Record<'distillery' | 'brewery', string> = {
  distillery: 'Q1251750',
  brewery: 'Q131734',
};

export interface WikidataProducerRaw {
  qid: string;
  name: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  inceptionYear: number | null;
}

interface SparqlBinding {
  item: { value: string };
  itemLabel?: { value: string };
  countryLabel?: { value: string };
  coord?: { value: string };
  website?: { value: string };
  inception?: { value: string };
}

function parsePoint(wkt: string | undefined): { lng: number | null; lat: number | null } {
  // Wikidata returns coordinates as "Point(lon lat)" WKT literals.
  if (!wkt) return { lng: null, lat: null };
  const match = /Point\(([-\d.]+)\s+([-\d.]+)\)/.exec(wkt);
  if (!match) return { lng: null, lat: null };
  return { lng: Number(match[1]), lat: Number(match[2]) };
}

function qidFromUri(uri: string): string {
  return uri.split('/').pop() ?? uri;
}

@Injectable()
export class WikidataAdapter {
  private readonly logger = new Logger(WikidataAdapter.name);

  async fetchByType(type: 'distillery' | 'brewery', limit: number): Promise<WikidataProducerRaw[]> {
    const qid = WIKIDATA_TYPE_QIDS[type];
    const query = `
      SELECT ?item ?itemLabel ?countryLabel ?coord ?website ?inception WHERE {
        ?item wdt:P31/wdt:P279* wd:${qid} .
        OPTIONAL { ?item wdt:P17 ?countryEntity . ?countryEntity rdfs:label ?countryLabel . FILTER(LANG(?countryLabel) = "en") }
        OPTIONAL { ?item wdt:P625 ?coord }
        OPTIONAL { ?item wdt:P856 ?website }
        OPTIONAL { ?item wdt:P571 ?inception }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
      }
      LIMIT ${limit}
    `.trim();

    let res: Response;
    try {
      res = await fetch(`${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`, {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': USER_AGENT,
        },
      });
    } catch (err) {
      this.logger.error(`Wikidata query for ${type} threw: ${err}`);
      throw new Error(`Wikidata fetch failed for ${type}: ${err instanceof Error ? err.message : err}`);
    }

    if (!res.ok) {
      throw new Error(`Wikidata query for ${type} failed with HTTP ${res.status}`);
    }

    const json: { results: { bindings: SparqlBinding[] } } = await res.json();

    // A single item can carry multiple P625 (coordinate) or other multi-valued
    // statements, which SPARQL's OPTIONAL joins expand into duplicate rows for the
    // same ?item — dedupe by QID, keeping the first (most-complete-so-far) row seen.
    const byQid = new Map<string, WikidataProducerRaw>();
    for (const b of json.results.bindings) {
      if (!b.itemLabel?.value) continue;
      const qid = qidFromUri(b.item.value);
      if (byQid.has(qid)) continue;
      const { lng, lat } = parsePoint(b.coord?.value);
      const inceptionYear = b.inception?.value ? new Date(b.inception.value).getFullYear() : null;
      byQid.set(qid, {
        qid,
        name: b.itemLabel.value,
        country: b.countryLabel?.value ?? null,
        lat,
        lng,
        website: b.website?.value ?? null,
        inceptionYear: Number.isFinite(inceptionYear) ? inceptionYear : null,
      });
    }
    return Array.from(byQid.values());
  }
}
