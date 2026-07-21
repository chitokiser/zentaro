"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { getToken } from "@/lib/auth-client"
import type { Product } from "@/lib/api"

export function ProductPurchasePanel({ product }: { product: Product }) {
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

  if (!getToken()) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          로그인
        </Link>{" "}
        후 구매할 수 있습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4">
      {maxExp > 0 ? (
        <p className="text-xs text-primary">최대 {maxExp.toLocaleString()} EXP로 결제 가능 (결제 시 적용)</p>
      ) : (
        <p className="text-xs text-muted-foreground">ZP 100% 결제 상품 (직배송/자체재고)</p>
      )}
      <p className="text-sm text-foreground">
        가격: <span className="font-medium">ZP {product.priceAp.toLocaleString()}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-primary/40 text-primary hover:bg-secondary"
          onClick={handleAddToCart}
        >
          {added ? "담았습니다" : "장바구니 담기"}
        </Button>
        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleBuyNow}>
          바로 구매
        </Button>
      </div>
    </div>
  )
}
