"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchInvestorWatchList,
  createInvestorWatch,
  deleteInvestorWatch,
  acknowledgeInvestorWatch,
  type InvestorWatch,
} from "@/lib/auth-client"

function formatDate(ts: { _seconds: number } | null): string {
  if (!ts) return "-"
  return new Date(ts._seconds * 1000).toLocaleDateString("ko-KR")
}

export default function AdminInvestorWatchPage() {
  const [items, setItems] = useState<InvestorWatch[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [form, setForm] = useState({
    address: "",
    label: "",
    grantDate: "",
    grantAmount: "",
    sellThreshold: "",
  })
  const [formBusy, setFormBusy] = useState(false)

  const load = useCallback(() => {
    fetchInvestorWatchList()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    const sellThreshold = Number(form.sellThreshold)
    const grantAmount = form.grantAmount.trim() === "" ? undefined : Number(form.grantAmount)
    if (!form.address.trim() || !form.label.trim() || !form.grantDate) {
      alert("지갑 주소, 라벨, 지급일을 모두 입력해주세요.")
      return
    }
    if (!Number.isFinite(sellThreshold) || sellThreshold <= 0) {
      alert("알림 기준 수량은 0보다 큰 숫자여야 합니다.")
      return
    }
    if (grantAmount !== undefined && (!Number.isFinite(grantAmount) || grantAmount <= 0)) {
      alert("지급 수량은 0보다 큰 숫자여야 합니다.")
      return
    }
    setFormBusy(true)
    setError(null)
    try {
      await createInvestorWatch({
        address: form.address.trim(),
        label: form.label.trim(),
        grantDate: new Date(form.grantDate).toISOString(),
        grantAmount,
        sellThreshold,
      })
      setForm({ address: "", label: "", grantDate: "", grantAmount: "", sellThreshold: "" })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.")
    } finally {
      setFormBusy(false)
    }
  }

  async function handleAcknowledge(id: string) {
    setBusy(id)
    setError(null)
    try {
      await acknowledgeInvestorWatch(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "확인 처리에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 감시 대상을 목록에서 삭제하시겠습니까?")) return
    setBusy(id)
    setError(null)
    try {
      await deleteInvestorWatch(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">투자자 지갑 감시</h2>
      <p className="text-sm text-muted-foreground">
        특정 날짜에 ZTARO를 지급한 지갑을 등록하면, 매시간 잔고를 확인해 누적 감소량이 설정한
        기준치를 넘는 순간 아래 목록에 알림이 표시됩니다. 다만 이 백엔드가 사용하는 무료
        opBNB RPC는 과거 이벤트(eth_getLogs) 조회를 지원하지 않아, &quot;PancakeSwap에서 매도&quot;와
        &quot;다른 지갑으로 이체&quot;를 구분하지 못합니다 — 잔고가 줄었다는 신호일 뿐, 정확한 매도
        추적기는 아닙니다. 정확한 판단이 필요하면 opBNBScan에서 해당 주소를 직접 조회하세요.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">신규 감시 등록</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground lg:col-span-2">
            지갑 주소
            <input
              type="text"
              placeholder="0x..."
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            라벨 (누구인지)
            <input
              type="text"
              placeholder="예: 시드투자자 A"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            지급일
            <input
              type="date"
              value={form.grantDate}
              onChange={(e) => setForm((f) => ({ ...f, grantDate: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            지급 수량 (선택)
            <input
              type="number"
              min={0}
              placeholder="ZTARO"
              value={form.grantAmount}
              onChange={(e) => setForm((f) => ({ ...f, grantAmount: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            알림 기준 (누적 감소, ZTARO)
            <input
              type="number"
              min={0}
              placeholder="예: 100000"
              value={form.sellThreshold}
              onChange={(e) => setForm((f) => ({ ...f, sellThreshold: e.target.value }))}
              className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
        </div>
        <Button size="sm" className="mt-3" disabled={formBusy} onClick={handleCreate}>
          {formBusy ? "등록 중..." : "등록"}
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">감시 목록 ({items?.length ?? 0})</h3>
        <div className="flex flex-col gap-2">
          {items === null ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground">등록된 감시 대상이 없습니다.</p>
          ) : null}
          {items?.map((item) => {
            const isActiveAlert =
              item.alertTriggered &&
              (!item.alertAcknowledgedAt ||
                (item.alertTriggeredAt &&
                  item.alertAcknowledgedAt._seconds < item.alertTriggeredAt._seconds))
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-2 rounded-md border px-4 py-3 text-sm ${
                  isActiveAlert ? "border-destructive/60 bg-destructive/5" : "border-border/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{item.address}</span>
                    {isActiveAlert ? (
                      <Badge className="border-none bg-destructive text-white text-[10px]">알림 발생</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {isActiveAlert ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === item.id}
                        onClick={() => handleAcknowledge(item.id)}
                      >
                        확인함
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>지급일: {formatDate(item.grantDate)}</span>
                  {item.grantAmount !== null ? <span>지급 수량: {item.grantAmount.toLocaleString()} ZTARO</span> : null}
                  <span>현재 잔고: {item.lastKnownBalance === null ? "확인 전" : `${item.lastKnownBalance.toLocaleString()} ZTARO`}</span>
                  <span>
                    누적 감소: {item.cumulativeDecrease.toLocaleString()} / {item.sellThreshold.toLocaleString()} ZTARO
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
