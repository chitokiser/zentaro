"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { DrinkProduct } from "@/lib/auth-client"

export function DrinkProductCard({ product }: { product: DrinkProduct }) {
  const primaryRating = product.externalRatings?.[0]

  return (
    <Link
      href={`/drinks/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-square w-full bg-secondary/30">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">N/A</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap gap-1">
          {product.subCategory ? (
            <Badge variant="outline" className="text-[10px]">
              {product.subCategory}
            </Badge>
          ) : null}
          {product.country ? (
            <Badge variant="outline" className="text-[10px]">
              {product.country}
            </Badge>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.producerName ?? "N/A"}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs">
          <span className="text-muted-foreground">{product.abv != null ? `${product.abv}% ABV` : "ABV N/A"}</span>
          {primaryRating ? (
            <span className="font-medium text-primary">
              {primaryRating.rating}/100 <span className="text-muted-foreground">({primaryRating.ratingCount})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      </div>
    </Link>
  )
}
