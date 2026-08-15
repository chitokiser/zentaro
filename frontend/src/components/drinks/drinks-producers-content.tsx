"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import {
  fetchDrinkProducers,
  fetchDrinkProducerCountries,
  type DrinkProducer,
  type DrinkCountryCount,
} from "@/lib/auth-client"

const PAGE_SIZE = 60

const TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery",
  distillery: "Distillery",
}

const SOURCE_LABELS: Record<string, string> = {
  openbrewerydb: "Open Brewery DB",
  wikidata: "Wikidata",
}

export function DrinksProducersContent() {
  const [producers, setProducers] = useState<DrinkProducer[] | null>(null)
  const [countries, setCountries] = useState<DrinkCountryCount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [producerType, setProducerType] = useState<string>("")
  const [country, setCountry] = useState<string>("")
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    fetchDrinkProducerCountries()
      .then(setCountries)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchDrinkProducers({ producerType: producerType || undefined, country: country || undefined, q: query || undefined })
        .then((res) => {
          setProducers(res)
          setVisibleCount(PAGE_SIZE)
        })
        .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
    }, 250)
    return () => clearTimeout(handle)
  }, [producerType, country, query])

  const visible = useMemo(() => producers?.slice(0, visibleCount) ?? [], [producers, visibleCount])

  return (
    <div>
      <PageHeader
        eyebrow="GLOBAL DRINKS DATABASE"
        title="Breweries & Distilleries"
        description="A global directory of breweries and distilleries, sourced from Open Brewery DB and Wikidata."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-3">
          <select
            value={producerType}
            onChange={(e) => setProducerType(e.target.value)}
            className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">All types</option>
            <option value="brewery">Brewery</option>
            <option value="distillery">Distillery</option>
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country} ({c.count})
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city..."
            className="min-w-[200px] flex-1 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && producers === null ? <p className="text-sm text-muted-foreground">불러오는 중...</p> : null}
        {producers && producers.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 결과가 없습니다.</p>
        ) : null}

        {producers && producers.length > 0 ? (
          <>
            <p className="mb-4 text-xs text-muted-foreground">{producers.length.toLocaleString()} results</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <Link
                  key={p.slug}
                  href={`/drinks/producers/${encodeURIComponent(p.slug)}`}
                  className="rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <span className="shrink-0 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                      {TYPE_LABELS[p.producerType] ?? p.producerType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[p.city, p.region, p.country].filter(Boolean).join(", ") || "위치 정보 없음"}
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground/70">{SOURCE_LABELS[p.source] ?? p.source}</p>
                </Link>
              ))}
            </div>
            {visibleCount < producers.length ? (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="rounded-full border border-border/60 px-6 py-2 text-sm text-foreground transition-colors hover:border-primary/50"
                >
                  Load more ({producers.length - visibleCount} remaining)
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
