"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getToken, fetchWallet, purchaseProduct } from "@/lib/auth-client"
import type { Product } from "@/lib/api"

const FULFILLMENT_LABEL: Record<string, string> = {
  dropshipping: "드랍쉬핑",
  direct: "직배송(자체재고)",
}

export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const [expBalance, setExpBalance] = useState<number | null>(null)
  const [expToUse, setExpToUse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const costAp = product.costAp ?? product.priceAp
  const margin = Math.max(0, product.priceAp - costAp)
  const isDropshipping = (product.fulfillmentType ?? "dropshipping") === "dropshipping"
  const maxExp = isDropshipping ? Math.floor(margin * 0.8) : 0

  async function handleOpen() {
    setOpen(true)
    setError(null)
    setResult(null)
    if (!getToken()) {
      setError("로그인이 필요합니다.")
      return
    }
    try {
      const wallet = await fetchWallet()
      setExpBalance(wallet.exp)
      setExpToUse(Math.min(maxExp, wallet.exp))
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    }
  }

  async function handlePurchase() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await purchaseProduct(product.id, expToUse)
      setResult(`구매 완료! AP ${res.apPaid.toLocaleString()} + EXP ${res.expPaid.toLocaleString()} 사용`)
      setExpBalance(res.remainingExp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "구매에 실패했습니다.")
    } finally {
      setBusy(false)
    }
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
        </div>
        <Link href={`/mall/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary">
          {product.name}
        </Link>
        <span className="text-xs text-muted-foreground">{product.priceAp.toLocaleString()} AP</span>
        {maxExp > 0 ? (
          <span className="text-[11px] text-primary">최대 {maxExp.toLocaleString()} EXP로 결제 가능 (마진의 80%)</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">AP 100% 결제 상품</span>
        )}

        {!open ? (
          <Button size="sm" className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleOpen}>
            구매하기
          </Button>
        ) : (
          <div className="mt-1 flex flex-col gap-2 rounded-md border border-border/40 p-2">
            {error === "로그인이 필요합니다." ? (
              <p className="text-[11px] text-muted-foreground">
                <Link href="/my/profile" className="text-primary underline underline-offset-4">
                  로그인
                </Link>{" "}
                후 구매할 수 있습니다.
              </p>
            ) : (
              <>
                {margin > 0 ? (
                  <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    사용할 EXP (보유: {expBalance?.toLocaleString() ?? 0}, 최대 {margin.toLocaleString()})
                    <input
                      type="number"
                      min={0}
                      max={Math.min(margin, expBalance ?? 0)}
                      value={expToUse}
                      onChange={(e) => setExpToUse(Number(e.target.value))}
                      className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
                    />
                  </label>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  결제: AP {(product.priceAp - expToUse).toLocaleString()} + EXP {expToUse.toLocaleString()}
                </p>
                <Button size="sm" disabled={busy} onClick={handlePurchase} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {busy ? "처리 중..." : "결제 확정"}
                </Button>
              </>
            )}
            {error && error !== "로그인이 필요합니다." ? (
              <p className="text-[11px] text-destructive">{error}</p>
            ) : null}
            {result ? <p className="text-[11px] text-primary">{result}</p> : null}
          </div>
        )}
      </div>
    </div>
  )
}
