"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import {
  getToken,
  onAuthChanged,
  fetchWallet,
  fetchShippingAddress,
  checkoutCart,
  type ShippingAddress,
} from "@/lib/auth-client"

const EMPTY_ADDRESS: ShippingAddress = {
  recipientName: "",
  phone: "",
  postalCode: "",
  addressLine1: "",
  addressLine2: "",
  deliveryMemo: "",
}

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, clear, totalPriceAp } = useCart()
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
  const [expBalance, setExpBalance] = useState(0)
  const [expInputs, setExpInputs] = useState<Record<string, number>>({})
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [saveAddress, setSaveAddress] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ orderId: string; totalApPaid: number; totalExpPaid: number } | null>(null)

  useEffect(() => onAuthChanged(() => setLoggedIn(Boolean(getToken()))), [])

  useEffect(() => {
    if (!loggedIn) return
    fetchWallet()
      .then((w) => setExpBalance(w.exp))
      .catch(() => setExpBalance(0))
    fetchShippingAddress()
      .then((a) => {
        if (a) setAddress(a)
      })
      .catch(() => undefined)
  }, [loggedIn])

  function lineMaxExp(item: (typeof items)[number]) {
    const margin = Math.max(0, item.priceAp - item.costAp)
    return item.fulfillmentType === "dropshipping" ? Math.floor(margin * 0.8) * item.quantity : 0
  }

  function setLineExp(productId: string, value: number, max: number) {
    setExpInputs((prev) => ({ ...prev, [productId]: Math.max(0, Math.min(value, max)) }))
  }

  const totalExpToUse = items.reduce((sum, item) => sum + Math.min(expInputs[item.productId] ?? 0, lineMaxExp(item)), 0)
  const totalApToPay = totalPriceAp - totalExpToUse

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await checkoutCart({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        expToUse: totalExpToUse,
        shippingAddress: address,
        saveAddress,
      })
      setResult(res)
      clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-primary">주문이 완료되었습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">주문번호: {result.orderId}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          결제: ZP {result.totalApPaid.toLocaleString()} + <span className="notranslate">EXP</span> {result.totalExpPaid.toLocaleString()}
        </p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/mall">쇼핑 계속하기</Link>
        </Button>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          로그인
        </Link>{" "}
        후 결제할 수 있습니다.
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        장바구니가 비어 있습니다.{" "}
        <Link href="/mall" className="text-primary underline underline-offset-4">
          몰 구경하기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-primary">주문/결제</h1>

      <section className="flex flex-col gap-4">
        {items.map((item) => {
          const max = lineMaxExp(item)
          const expUsed = Math.min(expInputs[item.productId] ?? 0, max)
          return (
            <div key={item.productId} className="flex gap-3 rounded-lg border border-border/60 bg-card p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary/60">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.priceAp.toLocaleString()} ZP</span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="rounded border border-border/60 px-2"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    className="rounded border border-border/60 px-2"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-destructive underline underline-offset-4"
                    onClick={() => removeItem(item.productId)}
                  >
                    삭제
                  </button>
                </div>
                {max > 0 ? (
                  <label className="mt-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
                    사용할 <span className="notranslate">EXP</span> (최대 {max.toLocaleString()})
                    <input
                      type="number"
                      min={0}
                      max={Math.min(max, expBalance)}
                      value={expUsed}
                      onChange={(e) => setLineExp(item.productId, Number(e.target.value), max)}
                      className="w-32 rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
                    />
                  </label>
                ) : (
                  <span className="text-[11px] text-muted-foreground">ZP 100% 결제 상품</span>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">배송지 정보</h2>
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="받는 사람"
          value={address.recipientName}
          onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="연락처"
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="우편번호"
          value={address.postalCode}
          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="주소"
          value={address.addressLine1}
          onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="상세 주소 (선택)"
          value={address.addressLine2 ?? ""}
          onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="배송 메모 (선택)"
          value={address.deliveryMemo ?? ""}
          onChange={(e) => setAddress({ ...address, deliveryMemo: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
          다음에도 이 배송지 사용하기
        </label>
      </section>

      <section className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">상품 합계</span>
          <span>{totalPriceAp.toLocaleString()} ZP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground"><span className="notranslate">EXP</span> 사용 (보유 {expBalance.toLocaleString()})</span>
          <span>-{totalExpToUse.toLocaleString()} <span className="notranslate">EXP</span></span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span>최종 결제 (ZP)</span>
          <span>{totalApToPay.toLocaleString()} ZP</span>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {busy ? "처리 중..." : "결제 확정"}
      </Button>
    </form>
  )
}
