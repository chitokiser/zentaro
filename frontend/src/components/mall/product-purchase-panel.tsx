"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getToken, fetchWallet, purchaseProduct } from "@/lib/auth-client"
import type { Product } from "@/lib/api"

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [loggedIn, setLoggedIn] = useState(true)
  const [expBalance, setExpBalance] = useState<number | null>(null)
  const [expToUse, setExpToUse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const costAp = product.costAp ?? product.priceAp
  const margin = Math.max(0, product.priceAp - costAp)
  const isDropshipping = (product.fulfillmentType ?? "dropshipping") === "dropshipping"
  const maxExp = isDropshipping ? Math.floor(margin * 0.8) : 0

  useEffect(() => {
    if (!getToken()) {
      setLoggedIn(false)
      return
    }
    fetchWallet()
      .then((wallet) => {
        setExpBalance(wallet.exp)
        setExpToUse(Math.min(maxExp, wallet.exp))
      })
      .catch(() => setLoggedIn(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (!loggedIn) {
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
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          사용할 EXP (보유: {expBalance?.toLocaleString() ?? 0}, 최대 {maxExp.toLocaleString()})
          <input
            type="number"
            min={0}
            max={Math.min(maxExp, expBalance ?? 0)}
            value={expToUse}
            onChange={(e) => setExpToUse(Number(e.target.value))}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      ) : (
        <p className="text-xs text-muted-foreground">AP 100% 결제 상품 (직배송/자체재고)</p>
      )}
      <p className="text-sm text-foreground">
        결제 금액: <span className="font-medium">AP {(product.priceAp - expToUse).toLocaleString()}</span>
        {expToUse > 0 ? ` + EXP ${expToUse.toLocaleString()}` : ""}
      </p>
      <Button disabled={busy} onClick={handlePurchase} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {busy ? "처리 중..." : "결제 확정"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {result ? <p className="text-xs text-primary">{result}</p> : null}
    </div>
  )
}
