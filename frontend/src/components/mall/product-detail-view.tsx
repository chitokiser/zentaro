"use client"

import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { ProductPurchasePanel } from "@/components/mall/product-purchase-panel"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText, localizedList } from "@/lib/i18n/content"
import { localizedCategory, localizedFulfillment } from "@/lib/i18n/mall-categories-i18n"
import { zpToVnd, formatVnd } from "@/lib/currency"
import { useZtaroDiscountPercent } from "@/lib/use-ztaro-discount"
import type { Product } from "@/lib/api"

export function ProductDetailView({ product }: { product: Product }) {
  const { locale } = useI18n()
  const ztaroDiscountPercent = useZtaroDiscountPercent()
  const productName = localizedText(locale, product.name, product.nameEn, product.nameVi)
  const productDescription = localizedText(locale, product.description, product.descriptionEn, product.descriptionVi)
  const productBadges = localizedList(locale, product.badges, product.badgesEn, product.badgesVi)

  return (
    <div>
      <PageHeader eyebrow="ZENTARO Mall" title={productName} />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/60">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {localizedCategory(locale, product.category)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {localizedCategory(locale, product.category)}
              </Badge>
              <Badge variant="secondary">
                {localizedFulfillment(locale, product.fulfillmentType)}
              </Badge>
              {productBadges.map((b) => (
                <Badge key={b} variant="outline" className="border-gold/40">
                  {b}
                </Badge>
              ))}
            </div>
            <p className="font-display text-2xl font-semibold text-primary">
              {product.priceAp.toLocaleString()} ZP
              {product.priceZtaro ? (
                <span className="ml-2 text-lg font-medium text-muted-foreground">
                  · {product.priceZtaro.toLocaleString()} ZTARO ({ztaroDiscountPercent}% 할인)
                </span>
              ) : null}
              <span className="ml-2 text-base font-medium text-muted-foreground">
                · {formatVnd(zpToVnd(product.priceAp))}
              </span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{productDescription}</p>

            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
