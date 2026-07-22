"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchPublicBarrels,
  deleteBarrelAdmin,
  fetchBarrelPricingConfig,
  updateBarrelPricingConfigAdmin,
  type PublicBarrel,
  type BarrelPricingConfig,
} from "@/lib/auth-client"

const DELIVERED_STATUS = "직접 배송 완료"

export default function AdminBarrelsPage() {
  const [items, setItems] = useState<PublicBarrel[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [pricing, setPricing] = useState<BarrelPricingConfig | null>(null)
  const [pricingForm, setPricingForm] = useState({ baseUsdPerLiter: "", usdToZpRate: "", annualGrowthRate: "" })
  const [pricingBusy, setPricingBusy] = useState(false)
  const [pricingMessage, setPricingMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchPublicBarrels()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  const loadPricing = useCallback(() => {
    fetchBarrelPricingConfig()
      .then((config) => {
        setPricing(config)
        setPricingForm({
          baseUsdPerLiter: String(config.baseUsdPerLiter),
          usdToZpRate: String(config.usdToZpRate),
          annualGrowthRate: String(Math.round(config.annualGrowthRate * 100)),
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : "가격 정책을 불러오지 못했습니다."))
  }, [])

  useEffect(() => {
    load()
    loadPricing()
  }, [load, loadPricing])

  async function handleSavePricing() {
    const baseUsdPerLiter = Number(pricingForm.baseUsdPerLiter)
    const usdToZpRate = Number(pricingForm.usdToZpRate)
    const annualGrowthPercent = Number(pricingForm.annualGrowthRate)
    if ([baseUsdPerLiter, usdToZpRate, annualGrowthPercent].some((n) => !Number.isFinite(n) || n < 0)) {
      alert("모든 값은 0 이상의 숫자여야 합니다.")
      return
    }
    setPricingBusy(true)
    setPricingMessage(null)
    setError(null)
    try {
      const updated = await updateBarrelPricingConfigAdmin({
        baseUsdPerLiter,
        usdToZpRate,
        annualGrowthRate: annualGrowthPercent / 100,
      })
      setPricing(updated)
      setPricingMessage("가격 정책이 저장되었습니다. 모든 배럴 시세에 즉시 반영됩니다.")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "가격 정책 저장에 실패했습니다.")
    } finally {
      setPricingBusy(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`배럴 ${id} 레코드를 완전히 삭제하시겠습니까? 배송이 완료되어 실물을 인도한 경우에만 사용하세요.`)) return
    setBusy(id)
    setError(null)
    try {
      await deleteBarrelAdmin(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  const deliverable = items?.filter((item) => item.status === DELIVERED_STATUS) ?? []
  const inProgress = items?.filter((item) => item.status !== DELIVERED_STATUS) ?? []

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">오크배럴 관리</h2>
      <p className="text-sm text-muted-foreground">
        전체 회원의 배럴 소유 현황입니다. 실물 배송이 완료된 배럴은 여기에서 레코드를 삭제해 마감 처리하세요.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-1 text-sm font-medium">배럴 시세 정책</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          모든 배럴의 판매 가격은 용량(L) × 리터당 원가 × 화면을 새로고침할 때마다 다시 계산되는 숙성 시간
          복리 성장분으로 자동 산정됩니다. 오너는 가격을 임의로 지정할 수 없습니다.
        </p>
        {pricingMessage ? <p className="mb-2 text-xs text-emerald-500">{pricingMessage}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            리터당 원가 (USD)
            <input
              type="number"
              min={0}
              value={pricingForm.baseUsdPerLiter}
              onChange={(e) => setPricingForm((f) => ({ ...f, baseUsdPerLiter: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            USD → ZP 환율 (1 USD = ? ZP)
            <input
              type="number"
              min={0}
              value={pricingForm.usdToZpRate}
              onChange={(e) => setPricingForm((f) => ({ ...f, usdToZpRate: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            연간 성장률 (%)
            <input
              type="number"
              min={0}
              value={pricingForm.annualGrowthRate}
              onChange={(e) => setPricingForm((f) => ({ ...f, annualGrowthRate: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
        </div>
        <Button size="sm" className="mt-3" disabled={pricingBusy || pricing === null} onClick={handleSavePricing}>
          {pricingBusy ? "저장 중..." : "저장"}
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">배송 완료 · 삭제 대상 ({deliverable.length})</h3>
        <div className="flex flex-col gap-3">
          {deliverable.length === 0 ? (
            <p className="text-xs text-muted-foreground">삭제 대상 배럴이 없습니다.</p>
          ) : null}
          {deliverable.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{item.id}</span>
                <Badge variant="outline" className="text-[10px]">{item.capacity}</Badge>
                <Badge variant="outline" className="text-[10px]">{item.ownerLabel}</Badge>
                <Badge className="bg-amber-500 text-black border-none text-[10px]">{item.status}</Badge>
              </div>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy === item.id}
                onClick={() => handleDelete(item.id)}
              >
                삭제 (배송 완료 처리)
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">보관 / 숙성 중 ({inProgress.length})</h3>
        <div className="flex flex-col gap-2">
          {items === null ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : inProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground">해당하는 배럴이 없습니다.</p>
          ) : null}
          {inProgress.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-4 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                <span>{item.capacity} · {item.ownerLabel}</span>
                {item.forSale ? (
                  <Badge className="bg-emerald-500 text-black border-none text-[10px]">
                    판매중 {item.currentValueZp.toLocaleString()} ZP
                  </Badge>
                ) : null}
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {item.status === "ordered" ? "보관 대기" : item.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
