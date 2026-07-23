"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { submitVendorInquiry } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"

const EMPTY_FORM = {
  productName: "",
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  supplyPrice: "",
  minOrderQty: "",
  sampleAvailable: false,
}

export default function VendorInquiryPage() {
  const { t } = useI18n()
  const v = t.vendorInquiry
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await submitVendorInquiry({
        ...form,
        website: form.website || undefined,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : v.submitError)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-primary">{v.doneTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {v.doneDescription}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">{v.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {v.description}
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {v.productNameLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.productName}
          onChange={(e) => set("productName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.companyNameLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.companyName}
          onChange={(e) => set("companyName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.contactNameLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.contactName}
          onChange={(e) => set("contactName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.emailLabel}
        <input
          type="email"
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.phoneLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.websiteLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="https://"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.supplyPriceLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={v.supplyPricePlaceholder}
          value={form.supplyPrice}
          onChange={(e) => set("supplyPrice", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {v.minOrderQtyLabel}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder={v.minOrderQtyPlaceholder}
          value={form.minOrderQty}
          onChange={(e) => set("minOrderQty", e.target.value)}
          required
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.sampleAvailable}
          onChange={(e) => set("sampleAvailable", e.target.checked)}
        />
        {v.sampleAvailableLabel}
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {busy ? v.submitting : v.submitButton}
      </Button>
    </form>
  )
}
