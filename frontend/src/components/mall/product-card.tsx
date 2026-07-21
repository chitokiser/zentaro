"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/lib/api"

const FULFILLMENT_LABEL: Record<string, string> = {
  dropshipping: "드랍쉬핑",
  direct: "직배송(자체재고)",
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const costAp = product.costAp ?? product.priceAp
  const margin = Math.max(0, product.priceAp - costAp)
  const isDropshipping = (product.fulfillmentType ?? "dropshipping") === "dropshipping"
  const maxExp = isDropshipping ? Math.floor(margin * 0.8) : 0

  function cartItem() {
    return {
      productId: product.id,
      name: product.name,
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <Link href={`/mall/${product.id}`} className="relative flex aspect-square items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          product.category
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="w-fit border-primary/40 text-[10px] text-primary">
            {product.category}
          </Badge>
          <Badge variant="secondary" className="w-fit text-[10px]">
            {FULFILLMENT_LABEL[product.fulfillmentType ?? "dropshipping"]}
          </Badge>
          {product.badges?.map((b) => (
            <Badge key={b} variant="outline" className="w-fit border-gold/40 text-[10px]">
              {b}
            </Badge>
          ))}
        </div>
        <Link href={`/mall/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary">
          {product.name}
        </Link>
        <span className="text-xs text-muted-foreground">{product.priceAp.toLocaleString()} ZP</span>
        {maxExp > 0 ? (
          <span className="text-[11px] text-primary">최대 {maxExp.toLocaleString()} EXP로 결제 가능</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">ZP 100% 결제 상품</span>
        )}

        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-primary/40 text-primary hover:bg-secondary"
            onClick={handleAddToCart}
          >
            {added ? "담았습니다" : "장바구니 담기"}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleBuyNow}
          >
            바로 구매
          </Button>
        </div>
      </div>
    </div>
  )
}
