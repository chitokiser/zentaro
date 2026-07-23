"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText, localizedList } from "@/lib/i18n/content"
import { localizedCategory, localizedFulfillment } from "@/lib/i18n/mall-categories-i18n"
import type { Product } from "@/lib/api"

interface ProductCardProps {
  product: Product
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
  deleteBusy?: boolean
}

export function ProductCard({ product, isAdmin, onEdit, onDelete, deleteBusy }: ProductCardProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { locale, t } = useI18n()
  const [added, setAdded] = useState(false)
  const productName = localizedText(locale, product.name, product.nameEn, product.nameVi)
  const productBadges = localizedList(locale, product.badges, product.badgesEn, product.badgesVi)

  const costAp = product.costAp ?? product.priceAp
  const margin = Math.max(0, product.priceAp - costAp)
  const isDropshipping = (product.fulfillmentType ?? "dropshipping") === "dropshipping"
  const maxExp = isDropshipping ? Math.floor(margin * 0.8) : 0

  function cartItem() {
    return {
      productId: product.id,
      name: productName,
      imageUrl: product.imageUrl,
      priceAp: product.priceAp,
      costAp,
      fulfillmentType: (product.fulfillmentType ?? "dropshipping") as "dropshipping" | "direct",
    }
  }

  function handleAddToCart() {
    addItem(cartItem())
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow() {
    addItem(cartItem())
    router.push("/checkout")
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      {isAdmin ? (
        <div className="absolute right-1.5 top-1.5 z-10 flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white hover:bg-black/90"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteBusy}
            className="rounded-md bg-destructive/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-destructive disabled:opacity-50"
          >
            {deleteBusy ? "삭제 중" : "삭제"}
          </button>
        </div>
      ) : null}
      <Link href={`/mall/${product.id}`} className="relative flex aspect-square items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          localizedCategory(locale, product.category)
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="w-fit border-primary/40 text-[10px] text-primary">
            {localizedCategory(locale, product.category)}
          </Badge>
          <Badge variant="secondary" className="w-fit text-[10px]">
            {localizedFulfillment(locale, product.fulfillmentType)}
          </Badge>
          {productBadges.map((b) => (
            <Badge key={b} variant="outline" className="w-fit border-gold/40 text-[10px]">
              {b}
            </Badge>
          ))}
        </div>
        <Link href={`/mall/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary">
          {productName}
        </Link>
        <span className="text-xs text-muted-foreground">{product.priceAp.toLocaleString()} ZP</span>
        {maxExp > 0 ? (
          <span className="text-[11px] text-primary">
            {t.mall.maxExpPrefix}{maxExp.toLocaleString()} <span className="notranslate">EXP</span>{t.mall.maxExpSuffix}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">{t.mall.zpOnly}</span>
        )}

        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-primary/40 text-primary hover:bg-secondary"
            onClick={handleAddToCart}
          >
            {added ? t.mall.addedToCart : t.mall.addToCart}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleBuyNow}
          >
            {t.mall.buyNow}
          </Button>
        </div>
      </div>
    </div>
  )
}
