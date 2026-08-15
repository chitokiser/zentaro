"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchBotanicalBySlug, type DrinkIngredient, type DrinkCocktail } from "@/lib/auth-client"

export function BotanicalDetailContent({ slug }: { slug: string }) {
  const [ingredient, setIngredient] = useState<DrinkIngredient | null>(null)
  const [relatedCocktails, setRelatedCocktails] = useState<DrinkCocktail[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBotanicalBySlug(slug)
      .then((res) => {
        setIngredient(res.ingredient)
        setRelatedCocktails(res.relatedCocktails)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [slug])

  if (error) return <div className="mx-auto max-w-3xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!ingredient) return <div className="mx-auto max-w-3xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      {ingredient.imageUrl ? (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-secondary/20">
          <Image src={ingredient.imageUrl} alt={ingredient.name} fill className="object-cover" sizes="768px" />
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {ingredient.isBotanical ? <Badge>Botanical</Badge> : null}
        {ingredient.type ? <Badge variant="outline">{ingredient.type}</Badge> : null}
        {ingredient.botanicalCategory ? <Badge variant="outline">{ingredient.botanicalCategory}</Badge> : null}
      </div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-foreground">{ingredient.name}</h1>

      {ingredient.alcoholic || ingredient.abv != null ? (
        <dl className="mb-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Alcoholic</dt>
          <dd>{ingredient.alcoholic ? "Yes" : "No"}</dd>
          <dt className="text-muted-foreground">ABV</dt>
          <dd>{ingredient.abv != null ? `${ingredient.abv}%` : "N/A"}</dd>
        </dl>
      ) : null}

      {ingredient.description ? (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{ingredient.description}</p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">N/A</p>
      )}

      {ingredient.sourceUrl ? (
        <p className="mb-8 text-xs text-muted-foreground">
          Source:{" "}
          <a href={ingredient.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
            {ingredient.sourceLicense ?? "View source"}
          </a>
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Related Cocktails</h2>
        {relatedCocktails.length === 0 ? (
          <p className="text-sm text-muted-foreground">N/A</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {relatedCocktails.map((c) => (
              <Link
                key={c.id}
                href={`/drinks/cocktails/${c.id}`}
                className="rounded-lg border border-border/60 bg-card p-3 text-sm hover:border-primary/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <Button asChild variant="outline" size="sm">
          <Link href="/botanicals">← Back to Botanicals</Link>
        </Button>
      </div>
    </div>
  )
}
