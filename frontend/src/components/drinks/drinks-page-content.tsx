"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { DrinkProductCard } from "@/components/drinks/drink-product-card"
import { useI18n } from "@/lib/i18n/i18n-context"
import { searchDrinks, type DrinkSearchResult } from "@/lib/auth-client"

const CATEGORIES = [
  { value: "spirit", label: "Spirits" },
  { value: "wine", label: "Wine" },
  { value: "beer", label: "Beer" },
  { value: "traditional", label: "Traditional" },
]

export function DrinksPageContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") ?? undefined)
  const [result, setResult] = useState<DrinkSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    searchDrinks(query, { category })
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : "검색에 실패했습니다."))
      .finally(() => setLoading(false))
  }, [query, category])

  return (
    <div>
      <PageHeader
        eyebrow="GLOBAL DRINKS DATABASE"
        title={t.drinks?.title ?? "ZENTARO GLOBAL DRINKS"}
        description={t.drinks?.subtitle ?? "Discover Drinks, Spirits, Ingredients & Flavors From Around the World"}
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href="/drinks/rankings" className="text-xs text-primary underline underline-offset-4">
            {t.drinks?.rankingsLink ?? "Rankings"}
          </Link>
          <Link href="/botanicals" className="text-xs text-primary underline underline-offset-4">
            {t.drinks?.botanicalsLink ?? "Botanicals"}
          </Link>
          <Link href="/drinks/statistics" className="text-xs text-primary underline underline-offset-4">
            {t.drinks?.statisticsLink ?? "Statistics"}
          </Link>
        </div>

        <div className="mb-6 max-w-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              t.drinks?.searchPlaceholder ?? "Search drinks, spirits, brands, ingredients, botanicals or countries..."
            }
            className="w-full rounded-lg border border-border/80 bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Badge
            variant={!category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategory(undefined)}
          >
            All
          </Badge>
          {CATEGORIES.map((c) => (
            <Badge
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Badge>
          ))}
        </div>

        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <>
            {result && result.products.length > 0 ? (
              <section className="mb-12">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Products ({result.products.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {result.products.map((p) => (
                    <DrinkProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ) : null}

            {result && result.cocktails.length > 0 ? (
              <section className="mb-12">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Cocktails ({result.cocktails.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {result.cocktails.slice(0, 24).map((c) => (
                    <Link
                      key={c.id}
                      href={`/drinks/cocktails/${c.id}`}
                      className="rounded-lg border border-border/60 bg-card p-3 text-sm hover:border-primary/50"
                    >
                      {c.name}
                      <p className="mt-1 text-xs text-muted-foreground">{c.category ?? "N/A"}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {result && result.ingredients.length > 0 ? (
              <section className="mb-12">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Ingredients &amp; Botanicals ({result.ingredients.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.ingredients.slice(0, 40).map((i) => (
                    <Link key={i.id} href={`/botanicals/${i.slug}`}>
                      <Badge variant="outline" className="cursor-pointer">
                        {i.name}
                        {i.isBotanical ? " 🌿" : ""}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {result && result.products.length === 0 && result.cocktails.length === 0 && result.ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
