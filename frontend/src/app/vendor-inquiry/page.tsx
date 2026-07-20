"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { submitVendorInquiry } from "@/lib/auth-client"

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
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-primary">문의가 접수되었습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          담당자 검토 후 기재해주신 연락처 또는 이메일로 회신드리겠습니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">입점 문의</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ZENTARO Mall에 상품 공급을 원하는 업체는 아래 양식을 작성해 주세요.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        상품명
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.productName}
          onChange={(e) => set("productName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        회사명
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.companyName}
          onChange={(e) => set("companyName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        담당자
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.contactName}
          onChange={(e) => set("contactName", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        이메일
        <input
          type="email"
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        연락처
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        홈페이지 (선택)
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="https://"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        공급단가
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="예: 5,000원/개, 협의 가능 등"
          value={form.supplyPrice}
          onChange={(e) => set("supplyPrice", e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        최소주문량
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="예: 100개"
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
        샘플 제공 가능
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {busy ? "제출 중..." : "문의 제출"}
      </Button>
    </form>
  )
}
