"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchZtaroPricingConfig, updateZtaroDiscountAdmin, updateZtaroEligibilityAdmin } from "@/lib/auth-client"

export default function AdminZtaroDiscountPage() {
  const [discountPercent, setDiscountPercent] = useState(30)
  const [discountInput, setDiscountInput] = useState("30")
  const [minStakeZtaro, setMinStakeZtaro] = useState(1_000_000)
  const [minLevel, setMinLevel] = useState(2)
  const [minStakeInput, setMinStakeInput] = useState("1000000")
  const [minLevelInput, setMinLevelInput] = useState("2")
  const [busy, setBusy] = useState(false)
  const [busyEligibility, setBusyEligibility] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchZtaroPricingConfig()
      .then((config) => {
        const percent = Math.round(config.discountRate * 100)
        setDiscountPercent(percent)
        setDiscountInput(String(percent))
        setMinStakeZtaro(config.minStakeZtaro)
        setMinStakeInput(String(config.minStakeZtaro))
        setMinLevel(config.minLevel)
        setMinLevelInput(String(config.minLevel))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSaveDiscount() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await updateZtaroDiscountAdmin(Number(discountInput))
      const percent = Math.round(res.discountRate * 100)
      setDiscountPercent(percent)
      setMessage(`할인율을 ${percent}%로 저장했습니다. 전체 상품의 ZTARO 가격이 즉시 재계산됩니다.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveEligibility() {
    setBusyEligibility(true)
    setError(null)
    setMessage(null)
    try {
      const res = await updateZtaroEligibilityAdmin({
        minStakeZtaro: Number(minStakeInput),
        minLevel: Number(minLevelInput),
      })
      setMinStakeZtaro(res.minStakeZtaro)
      setMinLevel(res.minLevel)
      setMessage(
        `ZTARO 결제 조건을 ${res.minStakeZtaro.toLocaleString()} ZTARO 이상 스테이킹 + 레벨 ${res.minLevel} 이상으로 저장했습니다.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusyEligibility(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">ZTARO 결제 설정</h2>
      <p className="text-sm text-muted-foreground">
        <span className="notranslate">ZTARO</span> 토큰으로 결제할 때 적용되는 할인율과, 결제 자격
        조건(최소 스테이킹 수량·최소 회원 레벨)입니다. 원가(costAp) 밑으로는 절대 팔리지
        않도록 할인율은 자동으로 보호됩니다.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground">현재 할인율</p>
          <p className="font-display text-2xl font-semibold text-primary">{discountPercent}%</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground">현재 결제 조건</p>
          <p className="font-display text-lg font-semibold text-primary">
            {minStakeZtaro.toLocaleString()} <span className="notranslate">ZTARO</span> · 레벨 {minLevel} 이상
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-primary">{message}</p> : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="text-sm font-medium">할인율 변경</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            할인율 (%, 기본값 30)
            <input
              type="number"
              min={0}
              max={90}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button
            size="sm"
            disabled={busy}
            onClick={handleSaveDiscount}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="text-sm font-medium">결제 자격 조건 변경</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            최소 스테이킹 <span className="notranslate">ZTARO</span> (기본값 1,000,000)
            <input
              type="number"
              min={0}
              value={minStakeInput}
              onChange={(e) => setMinStakeInput(e.target.value)}
              className="w-40 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            최소 회원 레벨 (기본값 2)
            <input
              type="number"
              min={1}
              max={10}
              value={minLevelInput}
              onChange={(e) => setMinLevelInput(e.target.value)}
              className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button
            size="sm"
            disabled={busyEligibility}
            onClick={handleSaveEligibility}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busyEligibility ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
