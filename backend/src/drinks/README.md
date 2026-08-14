# ZENTARO Global Drinks Database

MVP implementation of the Global Drinks Database feature (`/drinks`, `/botanicals`, admin
sync at `/admin/drinks`). Reuses the existing NestJS + Firestore + Next.js stack — no new
framework or database was introduced.

## 1. External APIs used

| Source | URL | License | API key |
| --- | --- | --- | --- |
| WHISKY:EDITION | https://thewhiskyedition.com/developer | CC BY 4.0 — attribution link required wherever a review is shown | None required |
| TheCocktailDB | https://www.thecocktaildb.com/ | Free/test key `"1"` — attribution recommended | `"1"` (shared free key, hardcoded in `adapters/cocktaildb.adapter.ts`) |
| Beer9 (RapidAPI) | https://beer9.p.rapidapi.com | RapidAPI subscription — free tier capped at **100 requests/month** | `BEER9_API_KEY` env var |

### Beer9 is NOT on the daily cron

Beer9's free tier only allows 100 requests/month (100 items/page), so unlike the two
sources above it is **never** called from `DrinksSyncService.handleCron()`. Instead:
- `POST /drinks/admin/sync-beer9-once` (admin level 2+, from `/admin/drinks`) does a
  one-time paginated pull, capped at `maxPages` (default 80) and stopping early if the
  `X-RateLimit-Requests-Remaining` response header drops to ≤3 — so a single run can
  never fully exhaust the month's quota.
- Refuses to run a second time (`BadRequestException`) once `zentaro_drinks_sources/beer9`
  has an `oneTimeSyncCompletedAt` unless `force: true` is explicitly passed — re-running
  only refreshes existing docs (upserts are keyed by `sku`), so the guard exists purely to
  stop *accidental* quota burn, not to prevent a deliberate re-run.
- Category is `beer` (already a top-level filter in `/drinks`), producer is the brewery
  name, and — unlike WHISKY:EDITION — Beer9 actually returns structured `tasting_notes`
  and `food_pairing` text, which are split on commas into `product.taste` / `product.foodPairing`
  (same deterministic comma-split already used for TheCocktailDB's `strTags`, not a guessed
  taxonomy). Beer9's `rating` field has no documented scale and is almost always blank, so
  it's intentionally left out of `externalRatings` rather than assumed to be out of 5/10/100.

Attribution is satisfied by `product.sourceUrl` / `cocktail.sourceUrl` links rendered on every
detail page, plus `ZENTARO_DRINKS_SOURCES` storing `sourceName/sourceUrl/license` per source.

### Endpoints actually called
- WHISKY:EDITION: `GET /api/whisky-reviews?page=&per_page=` (paginated list, `items[]` + `total`).
  No per-review detail call is made — the list endpoint already returns name/metadata/image/
  rating/url, which is everything the MVP schema uses.
- TheCocktailDB: `GET /search.php?f=<a-z>` (drinks by first letter, ×26), `GET /list.php?i=list`
  (ingredient names — **capped at 100 by the free tier**, not a bug), `GET /search.php?i=<name>`
  (ingredient detail).

### Rate limits / commercial use
Neither API's public docs specify a hard rate limit for the free tier as of this writing.
TheCocktailDB explicitly gates some endpoints (most-popular, latest, random-bulk) behind a
paid Patreon key — those are intentionally not used here. If dataset size ever needs to grow
beyond the free tier's ~100 ingredient cap, upgrading the CocktailDB key is a one-line change
(`BASE_URL` in `adapters/cocktaildb.adapter.ts`).

## 2. Environment variables

None added — the sync module reuses the existing Firestore credentials
(`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`) already configured
on Railway. No API key is required for either external source.

## 3. Database schema (Firestore collections, see `backend/src/common/collections.ts`)

- `zentaro_drinks_products` — spirits/wine/beer/traditional products (currently: WHISKY:EDITION
  reviews only). Country/category are denormalized string fields, not separate collections —
  Firestore has no joins, so this matches the existing `zentaro_products.mainCategory` pattern.
- `zentaro_drinks_producers` — reserved for a future brand/producer entity; not yet populated
  (WHISKY:EDITION's `distillery`/`bottler` names are currently stored inline as
  `product.producerName` rather than a separate doc, since nothing yet needs to look them up
  independently of a product).
- `zentaro_drinks_ingredients` — TheCocktailDB ingredients + admin-entered botanicals, unified
  via an `isBotanical` flag (see §4).
- `zentaro_drinks_cocktails` — TheCocktailDB drinks.
- `zentaro_drinks_user_ratings` — one doc per `{uid}_{productSlug}`, ZENTARO's own member
  ratings (1-5 stars), aggregated onto `product.zentaroRating` / `zentaroRatingCount`.
- `zentaro_drinks_sources` — one doc per external source (`sourceName`, `sourceUrl`, `license`,
  `lastSyncedAt`).
- `zentaro_drinks_sync_logs` — one doc per sync run (`newRecords`, `updatedRecords`, `errors[]`).
- `zentaro_drinks_ranking_config` — singleton doc `{ minReviews }` for the ranking formula.

## 4. Data quality — no fabrication

Fields the source APIs don't provide are stored as `null` and rendered as `N/A` on the
frontend — nothing is guessed. Concretely:
- Whisky reviews' `tasting_notes` (nose/palate/finish free text) are **not** parsed into the
  spec's fixed aroma/taste/finish taxonomy, because there is no deterministic, verifiable rule
  for turning free text into that taxonomy without guessing. `aroma`/`taste`/`finish` on
  WHISKY:EDITION-sourced products are left empty.
- `isBotanical` on TheCocktailDB ingredients is set via a small curated name list
  (`KNOWN_BOTANICAL_NAMES` in `normalizer.service.ts`) seeded from the spec's own botanical
  examples — this is a deterministic lookup against real ingredient names, not an inferred
  guess. Admins can also add/edit botanicals directly (`POST/PUT /botanicals/admin`) — the
  spec's own fallback priority "5. 관리자 직접 입력" for data no API provides.
- `country` on products is the API's raw text (e.g. `"Scotland"`), not an ISO country code —
  WHISKY:EDITION doesn't return ISO codes and guessing a mapping (is Scotland "GB"? "UK"?)
  would be exactly the kind of fabrication the spec prohibits. Country pages filter on this
  raw string.

## 5. Sync mechanism

`DrinksSyncService.handleCron()` runs daily at **03:00 UTC** via `@nestjs/schedule`'s `@Cron`
(same mechanism as `youtube-monitor.service.ts` and `ztaro-pricing.service.ts`'s daily jobs).
`POST /drinks/admin/sync-now` (admin level 2+) triggers the same logic on demand — used by the
"지금 동기화" button on `/admin/drinks`.

Each run: fetch all three sources → normalize → (products only) check for a same-producer/
same-name/same-ABV duplicate from a different source and flag `mergeCandidateOf` instead of
auto-merging → upsert into Firestore → recompute rankings → write one `sync_logs` doc → upsert
`sources` docs with a fresh `lastSyncedAt`.

## 6. Ranking algorithm

Bayesian/weighted rating: `weighted = (v / (v + m)) * R + (m / (v + m)) * C`, where `v` =
review count, `R` = the product's rating, `m` = admin-configured minimum reviews (default 10,
settable at `/admin/drinks`), `C` = the average rating across all products in the same
category. This is what keeps a 5.0-with-1-review item from outranking a 4.8-with-10,000-review
item. Recomputed after every sync and whenever `minReviews` changes.

## 7. Data sources / attribution summary

Every product/cocktail detail page renders a "Source: <link>" line pointing at the original
WHISKY:EDITION review or TheCocktailDB drink page, satisfying both APIs' attribution
requirements. External ratings and ZENTARO's own member ratings are always shown as two
visually separate numbers — never combined into one score (§24 of the original spec).

## 8. API rate limits

Not documented by either provider as a hard number for the free tier. The daily cron issues
roughly: 22 requests to WHISKY:EDITION (526 reviews / 24 per page), 26 requests to
TheCocktailDB (`search.php?f=a..z`), 1 request for the ingredient name list, and up to 100
requests for ingredient details (one per name, free tier cap) — a few dozen to ~150 requests
once per day, well within any reasonable free-tier ceiling.

## 9. Adding another source later (§18 of the original spec)

The adapter/normalizer/dedupe pipeline is intentionally source-agnostic: add a new
`adapters/<source>.adapter.ts` (raw fetch only), a `normalize<Source>...()` method on
`DrinksNormalizerService` (raw → common schema), wire it into `DrinksSyncService`, and the
existing dedupe/ranking/search/detail code needs no changes.

## 10. Explicitly out of scope for this MVP (see the approved plan for the full list)

AI natural-language search, price tracking, an image-hosting/licensing pipeline (images are
linked from their original API host, never re-hosted), and URL-based locale routing
(`/en/drinks`) — the site uses a client-side locale switcher everywhere else, so `/drinks`
follows that same convention instead of introducing a second routing scheme.
