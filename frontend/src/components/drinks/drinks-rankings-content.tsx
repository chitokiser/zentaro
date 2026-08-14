"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { DrinkProductCard } from "@/components/drinks/drink-product-card"
import { fetchDrinkRankings, type DrinkProduct } from "@/lib/auth-client"

const TABS = [
  { value: "top-rated", label: "Top Rated" },
  { value: "most-reviewed", label: "Most Reviewed" },
  { value: "new-releases", label: "New Releases" },
]

export function DrinksRankingsContent() {
  const [tab, setTab] = useState("top-rated")
  const [items, setItems] = useState<DrinkProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems(null)
    fetchDrinkRankings(tab)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [tab])

  return (
    <div>
      <PageHeader
        eyebrow="RANKINGS"
        title="Drinks Rankings"
        description="Ranked with a confidence-weighted score, not a raw average — a single 5-star review can't outrank thousands of consistent 4.8s."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Badge key={t.value} variant={tab === t.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setTab(t.value)}>
              {t.label}
            </Badge>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {items === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 랭킹 데이터가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <DrinkProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
