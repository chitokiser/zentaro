"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchZtaroPricingConfig, updateZtaroDiscountAdmin } from "@/lib/auth-client"

export default function AdminZtaroDiscountPage() {
  const [discountPercent, setDiscountPercent] = useState(30)
  const [input, setInput] = useState("30")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchZtaroPricingConfig()
      .then((config) => {
        const percent = Math.round(config.discountRate * 100)
        setDiscountPercent(percent)
        setInput(String(percent))
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await updateZtaroDiscountAdmin(Number(input))
      const percent = Math.round(res.discountRate * 100)
      setDiscountPercent(percent)
      setMessage(`할인율을 ${percent}%로 저장했습니다. 전체 상품의 ZTARO 가격이 즉시 재계산됩니다.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">ZTARO 결제 할인율</h2>
      <p className="text-sm text-muted-foreground">
        <span className="notranslate">ZTARO</span> 토큰으로 결제할 때 적용되는 할인율입니다.
        전체 상품에 공통 적용되며, 원가(costAp) 밑으로는 절대 팔리지 않도록 자동으로
        보호됩니다. 저장하면 모든 상품의 <span className="notranslate">priceZtaro</span>가
        즉시 재계산됩니다.
      </p>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">현재 적용 중인 할인율</p>
          <p className="font-display text-2xl font-semibold text-primary">{discountPercent}%</p>
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button
            size="sm"
            disabled={busy}
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
