"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PriceTrendChart } from "@/components/whisky-market/price-trend-chart"
import { fetchWhiskyAuctionHouse, type WhiskyAuctionHouseDetail } from "@/lib/auth-client"

export function WhiskyAuctionHouseDetailContent({ slug }: { slug: string }) {
  const [house, setHouse] = useState<WhiskyAuctionHouseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWhiskyAuctionHouse(slug)
      .then(setHouse)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [slug])

  const volumeTrend = useMemo(
    () => house?.history?.slice().reverse().map((h) => ({ dt: h.dt, value: h.auction_trading_volume })) ?? [],
    [house],
  )
  const bidTrend = useMemo(
    () => house?.history?.slice().reverse().map((h) => ({ dt: h.dt, value: h.winning_bid_mean })) ?? [],
    [house],
  )

  if (error) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!house) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/drinks/whisky/auction-houses" className="mb-6 inline-block text-xs text-primary underline underline-offset-4">
        ← Auction Houses
      </Link>

      <h1 className="font-display text-2xl font-semibold text-foreground">{house.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{house.baseCurrency} base currency</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <a href={house.url} target="_blank" rel="noreferrer">
            Browse Live Lots at {house.name} →
          </a>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        You will be redirected to the original auction house. ZENTARO does not place bids on your behalf.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Buyer&apos;s Fee</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">{house.buyersFee}%</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Seller&apos;s Fee</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">{house.sellersFee}%</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Reserve Fee</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">{house.reserveFee}%</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Listing Fee</p>
          <p className="mt-1 font-display text-lg font-semibold text-foreground">{house.listingFee}%</p>
        </div>
      </div>

      {volumeTrend.length > 0 ? (
        <section className="mt-10 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Monthly Trading Volume</h2>
          <p className="mb-4 text-xs text-muted-foreground">Total value of lots sold per month ({house.baseCurrency === "GBP" ? "£" : house.baseCurrency}).</p>
          <PriceTrendChart points={volumeTrend} valueLabel="Trading volume" />
        </section>
      ) : null}

      {bidTrend.length > 0 ? (
        <section className="mt-6 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Mean Winning Bid</h2>
          <p className="mb-4 text-xs text-muted-foreground">Average winning bid per month.</p>
          <PriceTrendChart points={bidTrend} valueLabel="Mean winning bid" valuePrefix="£" />
        </section>
      ) : null}

      <p className="mt-10 text-xs text-muted-foreground">
        Source:{" "}
        <a href={house.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
          {house.name}
        </a>{" "}
        · Market data: Whisky Hunter (whiskyhunter.net)
      </p>
    </div>
  )
}
