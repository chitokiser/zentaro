"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { DrinkProductCard } from "@/components/drinks/drink-product-card"
import { fetchDrinksByCountry, type DrinkProduct } from "@/lib/auth-client"

const FEATURED_COUNTRIES = ["Vietnam", "Korea", "Japan", "Scotland", "Ireland", "United States"]

export function DrinksCountryContent({ country }: { country: string }) {
  const [items, setItems] = useState<DrinkProduct[] | null>(null)

  useEffect(() => {
    setItems(null)
    fetchDrinksByCountry(country).then(setItems).catch(() => setItems([]))
  }, [country])

  return (
    <div>
      <PageHeader
        eyebrow="COUNTRIES"
        title={`${country} Spirits`}
        description={`Drinks and spirits from ${country}, including ZENTARO's own products where applicable.`}
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {FEATURED_COUNTRIES.map((c) => (
            <Link key={c} href={`/drinks/country/${encodeURIComponent(c)}`}>
              <Badge variant={c === country ? "default" : "outline"} className="cursor-pointer">
                {c}
              </Badge>
            </Link>
          ))}
        </div>

        {items === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 상품이 없습니다.</p>
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
