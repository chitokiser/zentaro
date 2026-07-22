"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText } from "@/lib/i18n/content"
import type { Product } from "@/lib/api"

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  const { locale } = useI18n()

  return (
    <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {products.slice(0, 10).map((product) => {
        const productName = localizedText(locale, product.name, product.nameEn, product.nameVi)
        return (
          <Link
            key={product.id}
            href="/mall"
            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/60"
          >
            <div className="relative flex aspect-square items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                product.category
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <Badge
                variant="outline"
                className="w-fit border-primary/40 text-[10px] text-primary"
              >
                {product.category}
              </Badge>
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                {productName}
              </span>
              <span className="text-xs text-muted-foreground">
                {product.priceAp.toLocaleString()} ZP
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
