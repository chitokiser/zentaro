"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchAllBottleCapClaimsAdmin,
  approveBottleCapClaim,
  rejectBottleCapClaim,
  type BottleCapClaim,
} from "@/lib/auth-client"

export default function AdminBottleCapClaimsPage() {
  const [items, setItems] = useState<BottleCapClaim[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [apInputs, setApInputs] = useState<Record<string, number>>({})

  const load = useCallback(() => {
    fetchAllBottleCapClaimsAdmin()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove(claim: BottleCapClaim) {
    const apAmount = apInputs[claim.id] ?? 0
    setBusy(claim.id)
    setError(null)
    try {
      await approveBottleCapClaim(claim.id, apAmount)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    setBusy(id)
    setError(null)
    try {
      await rejectBottleCapClaim(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "반려에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  const pending = items?.filter((item) => item.status === "pending") ?? []
  const reviewed = items?.filter((item) => item.status !== "pending") ?? []

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">병뚜껑 리워드 심사</h2>
      <p className="text-sm text-muted-foreground">
        회원이 발송한 병뚜껑 실물을 확인하고 쇼핑머니(ZP)를 지급합니다. ZENTARO 자체 증류주는
        승인 시 개당 ZP와 EXP가 동시에 지급됩니다.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">심사 대기 ({pending.length})</h3>
        <div className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <p className="text-xs text-muted-foreground">대기 중인 신청이 없습니다.</p>
          ) : null}
          {pending.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border/40 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {item.brand} x{item.quantity}
                </span>
                <Badge variant={item.isZentaro ? "default" : "outline"} className="text-[10px]">
                  {item.isZentaro
                    ? item.zentaroProduct === "blue"
                      ? "ZENTARO_Blue 드라이진 (EXP 30,000/개)"
                      : "ZENTARO_ORIGIN 증류식 소주 (EXP 10,000/개)"
                    : "기타 브랜드"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {item.email}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                연락처: {item.contactPhone}
                {item.trackingNumber ? ` · 송장번호: ${item.trackingNumber}` : ""}
              </p>
              {item.note ? <p className="text-xs text-muted-foreground">특이사항: {item.note}</p> : null}
              <p className="text-xs text-muted-foreground">
                봉인스티커 확인: {item.sealConfirmed ? "고객 확인 완료 (실물 재확인 필요)" : "미확인"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="지급 ZP"
                  className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  value={apInputs[item.id] ?? ""}
                  onChange={(e) =>
                    setApInputs((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                  }
                />
                <Button
                  size="sm"
                  disabled={busy === item.id}
                  onClick={() => handleApprove(item)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  승인 및 지급
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === item.id}
                  onClick={() => handleReject(item.id)}
                >
                  반려
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">심사 완료 ({reviewed.length})</h3>
        <div className="flex flex-col gap-2">
          {reviewed.length === 0 ? (
            <p className="text-xs text-muted-foreground">심사 완료된 신청이 없습니다.</p>
          ) : null}
          {reviewed.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2 text-sm"
            >
              <span>
                {item.brand} x{item.quantity} · {item.email}
              </span>
              <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                {item.status === "approved"
                  ? `승인 +${item.apAmount} ZP${item.expAmount ? ` · +${item.expAmount} EXP` : ""}`
                  : "반려"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
