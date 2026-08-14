"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { PriceTrendChart } from "@/components/whisky-market/price-trend-chart"
import {
  fetchWhiskyDashboard,
  fetchWhiskyDistilleries,
  type WhiskyMarketDashboard,
  type WhiskyDistillery,
} from "@/lib/auth-client"

function formatDt(dt: string | null) {
  if (!dt) return "N/A"
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return dt
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function WhiskyMarketDashboardContent() {
  const [dashboard, setDashboard] = useState<WhiskyMarketDashboard | null>(null)
  const [distilleries, setDistilleries] = useState<WhiskyDistillery[] | null>(null)
  const [query, setQuery] = useState("")
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWhiskyDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [])

  useEffect(() => {
    fetchWhiskyDistilleries({ country, q: query || undefined })
      .then(setDistilleries)
      .catch(() => setDistilleries([]))
  }, [country, query])

  const countries = useMemo(() => {
    if (!distilleries) return []
    return Array.from(new Set(distilleries.map((d) => d.country))).sort()
  }, [distilleries])

  const trendPoints = useMemo(
    () => dashboard?.trend.map((t) => ({ dt: t.dt, value: t.weightedMeanBid })) ?? [],
    [dashboard],
  )

  return (
    <div>
      <PageHeader
        eyebrow="WHISKY MARKET"
        title="GLOBAL WHISKY MARKET"
        description="Track auction market trends, distillery statistics and auction house data from around the world."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Link href="/drinks" className="text-primary underline underline-offset-4">
            ← Global Drinks
          </Link>
          <span>·</span>
          <Link href="/my/whisky" className="text-primary underline underline-offset-4">
            My Watchlist &amp; Targets
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Distilleries</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {dashboard ? dashboard.totalDistilleries.toLocaleString() : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Auction Houses</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {dashboard ? dashboard.totalAuctionHouses.toLocaleString() : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-primary/40 bg-secondary/30 p-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Market Data As Of</p>
            <p className="mt-1 font-display text-2xl font-semibold text-primary">{formatDt(dashboard?.lastDataDate ?? null)}</p>
          </div>
        </div>

        {trendPoints.length > 0 ? (
          <section className="mb-12 rounded-xl border border-border/60 bg-card p-5">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Market Price Index</h2>
              <span className="text-[10px] text-muted-foreground">Data source: Whisky Hunter</span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Lots-weighted mean winning bid across all tracked auction houses, by month (£).
            </p>
            <PriceTrendChart points={trendPoints} valueLabel="Weighted mean bid" valuePrefix="£" />
          </section>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Distilleries</h2>
          <Link href="/drinks/whisky/auction-houses" className="text-xs text-primary underline underline-offset-4">
            View Auction Houses →
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search distillery..."
            className="w-full max-w-xs rounded-lg border border-border/80 bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={!country ? "default" : "outline"} className="cursor-pointer" onClick={() => setCountry(undefined)}>
              All
            </Badge>
            {countries.map((c) => (
              <Badge key={c} variant={country === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setCountry(c)}>
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {distilleries === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : distilleries.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {distilleries.map((d) => (
              <Link
                key={d.slug}
                href={`/drinks/whisky/distillery/${d.slug}`}
                className="rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-primary/50"
              >
                <p className="font-medium text-foreground">{d.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d.country}</p>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-[10px] text-muted-foreground">
          Market data source: Whisky Hunter (whiskyhunter.net) — monthly aggregated auction statistics. Figures are
          market data insight, not investment advice or a guarantee of value.
        </p>
      </div>
    </div>
  )
}
