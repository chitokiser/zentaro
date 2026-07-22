"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchAllDepositsAdmin,
  approveDepositAdmin,
  rejectDepositAdmin,
  type DepositRequest,
} from "@/lib/auth-client"

export default function AdminDepositsPage() {
  const [items, setItems] = useState<DepositRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchAllDepositsAdmin()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove(id: string) {
    setBusy(id)
    setError(null)
    try {
      await approveDepositAdmin(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("반려 사유를 입력해 주세요 (선택)") ?? undefined
    setBusy(id)
    setError(null)
    try {
      await rejectDepositAdmin(id, reason)
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
      <h2 className="font-display text-xl font-semibold">ZP 충전 신청 관리</h2>
      <p className="text-sm text-muted-foreground">
        회원이 신청한 ZP 충전 건의 실제 입금을 계좌에서 확인한 뒤 승인하세요. 승인 시 해당 회원에게
        신청 ZP가 즉시 지급됩니다.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">승인 대기 ({pending.length})</h3>
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
                <span className="font-medium">{item.zpAmount.toLocaleString()} ZP</span>
                <Badge variant="outline" className="text-[10px]">
                  {item.currency}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {item.email}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">{item.refCode}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                입금자명: {item.depositorName}
                {item.createdAt ? ` · 신청일시: ${new Date(item.createdAt._seconds * 1000).toLocaleString()}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
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
        <h3 className="mb-3 text-sm font-medium">처리 완료 ({reviewed.length})</h3>
        <div className="flex flex-col gap-2">
          {reviewed.length === 0 ? (
            <p className="text-xs text-muted-foreground">처리 완료된 신청이 없습니다.</p>
          ) : null}
          {reviewed.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2 text-sm"
            >
              <span>
                {item.zpAmount.toLocaleString()} ZP · {item.email} · {item.depositorName}
              </span>
              <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                {item.status === "approved" ? "승인완료" : `반려${item.rejectReason ? ` (${item.rejectReason})` : ""}`}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
