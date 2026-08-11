"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchCocktailById, type DrinkCocktail } from "@/lib/auth-client"

export function CocktailDetailContent({ id }: { id: string }) {
  const [cocktail, setCocktail] = useState<DrinkCocktail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCocktailById(id)
      .then(setCocktail)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [id])

  if (error) return <div className="mx-auto max-w-3xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!cocktail) return <div className="mx-auto max-w-3xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
          {cocktail.imageUrl ? (
            <Image src={cocktail.imageUrl} alt={cocktail.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">N/A</div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {cocktail.category ? <Badge variant="outline">{cocktail.category}</Badge> : null}
            {cocktail.alcoholic ? <Badge variant="outline">{cocktail.alcoholic}</Badge> : null}
            {cocktail.glass ? <Badge variant="outline">{cocktail.glass}</Badge> : null}
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{cocktail.name}</h1>
          <div>
            <h2 className="mb-1 text-sm font-medium text-foreground">Ingredients</h2>
            <ul className="text-sm text-muted-foreground">
              {cocktail.ingredients.map((i, idx) => (
                <li key={idx}>
                  {i.name}
                  {i.measure ? ` — ${i.measure}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {cocktail.instructions ? (
        <div className="mt-10">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Instructions</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{cocktail.instructions}</p>
        </div>
      ) : null}

      {cocktail.sourceUrl ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Source:{" "}
          <a href={cocktail.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
            TheCocktailDB
          </a>
        </p>
      ) : null}

      <div className="mt-10">
        <Button asChild variant="outline" size="sm">
          <Link href="/drinks">← Back to Global Drinks</Link>
        </Button>
      </div>
    </div>
  )
}
