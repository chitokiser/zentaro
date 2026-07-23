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
import { useI18n } from "@/lib/i18n/i18n-context"

const EMPTY_ADDRESS: ShippingAddress = {
  recipientName: "",
  phone: "",
  postalCode: "",
  addressLine1: "",
  addressLine2: "",
  deliveryMemo: "",
}

export default function CheckoutPage() {
  const { t } = useI18n()
  const c = t.checkout
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
      setError(err instanceof Error ? err.message : c.orderError)
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-primary">{c.orderCompleteTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.orderNumberLabel} {result.orderId}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.paymentPrefix}{result.totalApPaid.toLocaleString()} + <span className="notranslate">EXP</span> {result.totalExpPaid.toLocaleString()}
        </p>
        <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/mall">{c.continueShopping}</Link>
        </Button>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          {c.loginCta}
        </Link>
        {c.loginSuffix}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        {c.emptyCart}{" "}
        <Link href="/mall" className="text-primary underline underline-offset-4">
          {c.browseMall}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-primary">{c.title}</h1>

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
                    {c.removeItem}
                  </button>
                </div>
                {max > 0 ? (
                  <label className="mt-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
                    {c.useExpPrefix} <span className="notranslate">EXP</span> {c.useExpMaxPrefix} {max.toLocaleString()}{c.useExpMaxSuffix}
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
                  <span className="text-[11px] text-muted-foreground">{c.zpOnlyItem}</span>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">{c.shippingInfoTitle}</h2>
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.recipientPlaceholder}
          value={address.recipientName}
          onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.phonePlaceholder}
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.postalCodePlaceholder}
          value={address.postalCode}
          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.addressPlaceholder}
          value={address.addressLine1}
          onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.addressDetailPlaceholder}
          value={address.addressLine2 ?? ""}
          onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={c.deliveryMemoPlaceholder}
          value={address.deliveryMemo ?? ""}
          onChange={(e) => setAddress({ ...address, deliveryMemo: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
          {c.saveAddressLabel}
        </label>
      </section>

      <section className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{c.subtotalLabel}</span>
          <span>{totalPriceAp.toLocaleString()} ZP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground"><span className="notranslate">EXP</span> {c.expUsedPrefix} {expBalance.toLocaleString()})</span>
          <span>-{totalExpToUse.toLocaleString()} <span className="notranslate">EXP</span></span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span>{c.finalPaymentLabel}</span>
          <span>{totalApToPay.toLocaleString()} ZP</span>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {busy ? c.submitting : c.submitButton}
      </Button>
    </form>
  )
}
