"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchDrinkBySlug,
  rateDrinkProduct,
  getToken,
  type DrinkProduct,
  type DrinkCocktail,
} from "@/lib/auth-client"

export function DrinkDetailContent({ slug }: { slug: string }) {
  const [product, setProduct] = useState<DrinkProduct | null>(null)
  const [relatedCocktails, setRelatedCocktails] = useState<DrinkCocktail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingMessage, setRatingMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchDrinkBySlug(slug)
      .then((res) => {
        setProduct(res.product)
        setRelatedCocktails(res.relatedCocktails)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [slug])

  async function submitRating(rating: number) {
    if (!getToken()) {
      setRatingMessage("로그인 후 평가할 수 있습니다.")
      return
    }
    setRatingBusy(true)
    setRatingMessage(null)
    try {
      await rateDrinkProduct(slug, rating)
      setMyRating(rating)
      setRatingMessage("평가가 반영되었습니다.")
      fetchDrinkBySlug(slug).then((res) => setProduct(res.product))
    } catch (err) {
      setRatingMessage(err instanceof Error ? err.message : "평가에 실패했습니다.")
    } finally {
      setRatingBusy(false)
    }
  }

  if (error) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!product) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  const primaryRating = product.externalRatings?.[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-6" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">N/A</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {product.subCategory ? <Badge variant="outline">{product.subCategory}</Badge> : null}
            {product.category ? <Badge variant="outline">{product.category}</Badge> : null}
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.producerName ?? "N/A"}</p>

          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Country</dt>
            <dd>{product.country ?? "N/A"}</dd>
            <dt className="text-muted-foreground">Region</dt>
            <dd>{product.region ?? "N/A"}</dd>
            <dt className="text-muted-foreground">ABV</dt>
            <dd>{product.abv != null ? `${product.abv}%` : "N/A"}</dd>
            <dt className="text-muted-foreground">Age</dt>
            <dd>{product.age != null ? `${product.age} years` : "N/A"}</dd>
          </dl>

          {/* External rating and ZENTARO's own rating are kept visually distinct — never combined into one score. */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                External Rating {primaryRating ? `(${primaryRating.source})` : ""}
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">
                {primaryRating ? `${primaryRating.rating} / 100` : "N/A"}
              </p>
              {primaryRating ? (
                <p className="text-[10px] text-muted-foreground">{primaryRating.ratingCount} reviews</p>
              ) : null}
            </div>
            <div className="rounded-lg border border-primary/40 bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">ZENTARO Rating</p>
              <p className="mt-1 font-display text-xl font-semibold text-primary">
                {product.zentaroRatingCount > 0 ? `${product.zentaroRating} / 5` : "No ratings yet"}
              </p>
              <p className="text-[10px] text-muted-foreground">{product.zentaroRatingCount} ratings</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                disabled={ratingBusy}
                onClick={() => submitRating(n)}
                className={`text-xl ${myRating != null && n <= myRating ? "text-primary" : "text-muted-foreground"}`}
              >
                ★
              </button>
            ))}
            {ratingMessage ? <span className="ml-2 text-xs text-muted-foreground">{ratingMessage}</span> : null}
          </div>

          {product.sourceUrl ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Source:{" "}
              <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                {product.source === "whisky-edition" ? "WHISKY:EDITION" : product.source}
              </a>
              {product.sourceLicense ? ` (${product.sourceLicense})` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {product.description ? (
        <div className="mt-10">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Description</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
      ) : null}

      {product.taste && product.taste.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Tasting Notes</h2>
          <div className="flex flex-wrap gap-1.5">
            {product.taste.map((note) => (
              <Badge key={note} variant="outline">
                {note}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {product.foodPairing && product.foodPairing.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Food Pairing</h2>
          <div className="flex flex-wrap gap-1.5">
            {product.foodPairing.map((pairing) => (
              <Badge key={pairing} variant="outline">
                {pairing}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {relatedCocktails.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Related Cocktails</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
        </div>
      ) : null}

      <div className="mt-10">
        <Button asChild variant="outline" size="sm">
          <Link href="/drinks">← Back to Global Drinks</Link>
        </Button>
      </div>
    </div>
  )
}
