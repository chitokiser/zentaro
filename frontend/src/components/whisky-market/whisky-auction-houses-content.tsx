"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { fetchWhiskyAuctionHouses, type WhiskyAuctionHouse } from "@/lib/auth-client"

export function WhiskyAuctionHousesContent() {
  const [houses, setHouses] = useState<WhiskyAuctionHouse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWhiskyAuctionHouses()
      .then(setHouses)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="WHISKY MARKET"
        title="Auction Houses"
        description="Whisky auction houses tracked by Whisky Hunter, with real buyer/seller fee schedules."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Link href="/drinks/whisky" className="mb-6 inline-block text-xs text-primary underline underline-offset-4">
          ← Whisky Market
        </Link>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {houses === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {houses.map((h) => (
              <Link
                key={h.slug}
                href={`/drinks/whisky/auction-house/${h.slug}`}
                className="rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-primary/50"
              >
                <p className="font-medium text-foreground">{h.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buyer&apos;s fee {h.buyersFee}% · {h.baseCurrency}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
