"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { WorldSpiritsMap } from "@/components/drinks/world-spirits-map"
import {
  fetchDrinkCountries,
  fetchDrinkProducerCountries,
  fetchDrinkStatistics,
  fetchDrinksByCountry,
  type DrinkCountryCount,
  type DrinkStatistics,
  type DrinkProduct,
} from "@/lib/auth-client"

const TOP_COUNTRIES_SHOWN = 6

/**
 * Best-effort join between two independently-sourced country string conventions —
 * drink products use source-API spellings ("Scotland", "USA"), the producer
 * directory uses Open Brewery DB/Wikidata spellings ("United Kingdom", "United
 * States"). Only well-known groupings are normalized; anything unmatched simply
 * shows no producer count rather than a guessed one.
 */
const PRODUCER_COUNTRY_ALIASES: Record<string, string> = {
  scotland: "united kingdom",
  wales: "united kingdom",
  england: "united kingdom",
  "northern ireland": "united kingdom",
  uk: "united kingdom",
  usa: "united states",
  us: "united states",
}

function toProducerCountryKey(country: string): string {
  const lower = country.trim().toLowerCase()
  return PRODUCER_COUNTRY_ALIASES[lower] ?? lower
}

const MAX_SIGNATURES_PER_COUNTRY = 3

interface CountryHighlight {
  country: string
  productCount: number
  producerCount: number
  signatures: DrinkProduct[]
}

export function DrinksWorldOverview() {
  const [countries, setCountries] = useState<DrinkCountryCount[] | null>(null)
  const [producerCountries, setProducerCountries] = useState<DrinkCountryCount[]>([])
  const [stats, setStats] = useState<DrinkStatistics | null>(null)
  const [highlights, setHighlights] = useState<CountryHighlight[] | null>(null)

  useEffect(() => {
    fetchDrinkCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
    fetchDrinkProducerCountries()
      .then(setProducerCountries)
      .catch(() => undefined)
    fetchDrinkStatistics()
      .then(setStats)
      .catch(() => undefined)
  }, [])

  const producerCountByKey = useMemo(() => {
    const map = new Map<string, number>()
    producerCountries.forEach((p) => {
      const key = toProducerCountryKey(p.country)
      map.set(key, (map.get(key) ?? 0) + p.count)
    })
    return map
  }, [producerCountries])

  const totalProducers = useMemo(
    () => producerCountries.reduce((sum, p) => sum + p.count, 0),
    [producerCountries],
  )

  useEffect(() => {
    if (!countries || countries.length === 0) return
    const top = countries.slice(0, TOP_COUNTRIES_SHOWN)
    Promise.all(
      top.map(async (c) => {
        const products = await fetchDrinksByCountry(c.country).catch(() => [] as DrinkProduct[])
        // A single "top rated" pick tends to collapse to the same subCategory for
        // whisky-heavy countries (e.g. always "Single Malt"), hiding real variety
        // that does exist in the data (Blended, Single Grain, Bourbon, ...). Picking
        // the best-rated product per distinct subCategory instead shows that real
        // diversity without inventing categories that have no data (e.g. gin — the
        // whisky-market source has none).
        const bestBySubCategory = new Map<string, DrinkProduct>()
        products
          .slice()
          .sort((a, b) => (b.weightedRating ?? b.zentaroRating ?? 0) - (a.weightedRating ?? a.zentaroRating ?? 0))
          .forEach((p) => {
            const key = p.subCategory || p.category || "other"
            if (!bestBySubCategory.has(key)) bestBySubCategory.set(key, p)
          })
        const signatures = Array.from(bestBySubCategory.values()).slice(0, MAX_SIGNATURES_PER_COUNTRY)
        return {
          country: c.country,
          productCount: c.count,
          producerCount: producerCountByKey.get(toProducerCountryKey(c.country)) ?? 0,
          signatures,
        }
      }),
    ).then(setHighlights)
    // producerCountByKey intentionally omitted — recomputed from the same countries list, avoids refetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries])

  if (countries === null) {
    return <p className="mb-12 text-sm text-muted-foreground">불러오는 중...</p>
  }
  if (countries.length === 0) {
    return null
  }

  return (
    <section className="mb-14">
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-card p-4 text-center">
          <p className="font-display text-2xl font-bold text-foreground">{countries.length}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Countries</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4 text-center">
          <p className="font-display text-2xl font-bold text-foreground">{totalProducers.toLocaleString()}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Distilleries &amp; Breweries</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4 text-center">
          <p className="font-display text-2xl font-bold text-foreground">{stats?.totalProducts?.toLocaleString() ?? "-"}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Products</p>
        </div>
      </div>

      <WorldSpiritsMap countries={countries} />

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Explore by Country</h2>
        <div className="flex gap-3 text-xs">
          <Link href="/drinks/countries" className="text-primary underline underline-offset-4">
            All countries →
          </Link>
          <Link href="/drinks/producers" className="text-primary underline underline-offset-4">
            All distilleries &amp; breweries →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(highlights ?? []).map((h) => (
          <Link
            key={h.country}
            href={`/drinks/country/${encodeURIComponent(h.country)}`}
            className="rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{h.country}</p>
              <span className="text-[10px] text-muted-foreground">{h.productCount} products</span>
            </div>
            {h.producerCount > 0 ? (
              <p className="mt-1 text-[11px] text-muted-foreground">{h.producerCount} distilleries/breweries listed</p>
            ) : null}
            {h.signatures.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {h.signatures.map((p) => (
                  <li key={p.id} className="truncate text-xs text-primary">
                    ★ {p.name}
                    {p.subCategory ? <span className="text-muted-foreground"> · {p.subCategory}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Link>
        ))}
        {highlights === null
          ? Array.from({ length: TOP_COUNTRIES_SHOWN }).map((_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-lg border border-border/40 bg-card/50" />
            ))
          : null}
      </div>
    </section>
  )
}
