"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchAllContributionsAdmin,
  approveContribution,
  rejectContribution,
  CONTRIBUTION_ITEM_LABELS,
  type Contribution,
} from "@/lib/auth-client"

export default function AdminContributionsPage() {
  const [items, setItems] = useState<Contribution[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [apInputs, setApInputs] = useState<Record<string, number>>({})

  const load = useCallback(() => {
    fetchAllContributionsAdmin()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove(id: string) {
    const apAmount = apInputs[id]
    if (!apAmount || apAmount < 1) {
      setError("지급할 ZP 금액을 입력하세요.")
      return
    }
    setBusy(id)
    setError(null)
    try {
      await approveContribution(id, apAmount)
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
      await rejectContribution(id)
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
      <h2 className="font-display text-xl font-semibold">현물출자 심사</h2>
      <p className="text-sm text-muted-foreground">
        회원이 신청한 오크통·브랜디·위스키·진·럼 실물출자를 검수하고 ZP(쇼핑머니)를 지급합니다.
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
                  {CONTRIBUTION_ITEM_LABELS[item.itemType] ?? item.itemType} x{item.quantity}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {item.email}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                연락처: {item.contactPhone}
                {item.address ? ` · 주소: ${item.address}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
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
                  onClick={() => handleApprove(item.id)}
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
                {CONTRIBUTION_ITEM_LABELS[item.itemType] ?? item.itemType} x{item.quantity} ·{" "}
                {item.email}
              </span>
              <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                {item.status === "approved" ? `승인 +${item.apAmount} ZP` : "반려"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
