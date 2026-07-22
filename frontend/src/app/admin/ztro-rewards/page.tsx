"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  issueZtroRewardCodes,
  listZtroRewardCodes,
  fetchZtroPoolBalance,
  type ZtroRewardCode,
  type ZtroRewardCodeItem,
} from "@/lib/auth-client"

const STATUS_LABEL: Record<ZtroRewardCode["status"], string> = {
  unused: "미사용",
  pending: "처리중",
  used: "사용됨",
  failed: "실패",
}

function formatDate(item: ZtroRewardCode) {
  const seconds = item.createdAt?._seconds
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString("ko-KR")
}

export default function AdminZtroRewardsPage() {
  const [items, setItems] = useState<ZtroRewardCode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(10)
  const [baseValue, setBaseValue] = useState(1)
  const [justIssued, setJustIssued] = useState<ZtroRewardCodeItem[] | null>(null)
  const [poolBalance, setPoolBalance] = useState<number | null>(null)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [viewingQrCode, setViewingQrCode] = useState<string | null>(null)

  const load = useCallback(() => {
    listZtroRewardCodes()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  const loadPoolBalance = useCallback(() => {
    fetchZtroPoolBalance()
      .then((res) => setPoolBalance(res.balance))
      .catch((err) => setPoolError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
    loadPoolBalance()
  }, [load, loadPoolBalance])

  async function handleIssue() {
    setBusy(true)
    setError(null)
    try {
      const res = await issueZtroRewardCodes(count, baseValue)
      setJustIssued(res.items)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "발행에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  const unused = items?.filter((item) => item.status === "unused") ?? []
  const used = items?.filter((item) => item.status !== "unused") ?? []

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">ZTRO 리워드 QR</h2>
      <p className="text-sm text-muted-foreground">
        발행한 QR을 스캔한 회원의 온체인 지갑으로 <b>기본값 × 랜덤 배율</b> 만큼의 ZTRO가
        즉시 지급됩니다. 각 QR은 1회만 사용할 수 있습니다.
      </p>
      <div className="rounded-md border border-border/40 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground">
        랜덤 배율 확률표: 1~100 (50%) · 100~500 (30%) · 500~2,500 (10%) · 2,500~5,000 (7%) ·
        5,000~10,000 (3%). 최대 지급액은 기본값 × 10,000이므로 리워드 풀 잔액을 그 이상으로
        준비해두세요.
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">컨트랙트 리워드 풀 잔액</p>
          {poolError ? (
            <p className="text-sm text-destructive">{poolError}</p>
          ) : (
            <p className="font-display text-2xl font-semibold text-primary">
              {poolBalance === null ? "불러오는 중..." : `${poolBalance.toLocaleString()} ZTRO`}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={loadPoolBalance}>
          새로고침
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="text-sm font-medium">QR 발행</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            발행 수량
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-24 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            기본값 (배율에 곱해질 값)
            <input
              type="number"
              min={1}
              value={baseValue}
              onChange={(e) => setBaseValue(Number(e.target.value))}
              className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button
            size="sm"
            disabled={busy}
            onClick={handleIssue}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "발행 중..." : "QR 발행"}
          </Button>
        </div>

        {justIssued ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              방금 발행한 QR입니다 — 인쇄/스크린샷으로 저장해두세요 (다시 불러올 수 없습니다).
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {justIssued.map((item) => (
                <div
                  key={item.code}
                  className="flex flex-col items-center gap-1 rounded-md border border-border/40 p-2"
                >
                  <img src={item.qrDataUrl} alt={item.code} className="h-24 w-24" />
                  <span className="font-mono text-[10px]">{item.code}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">미사용 ({unused.length})</h3>
        <div className="flex flex-col gap-2">
          {unused.length === 0 ? (
            <p className="text-xs text-muted-foreground">미사용 QR이 없습니다.</p>
          ) : null}
          {unused.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono">{item.code}</span>
                <span className="text-[10px] text-muted-foreground">생성: {formatDate(item)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">기본값 {item.baseValue}</span>
                <Badge variant="outline" className="text-[10px]">
                  {STATUS_LABEL[item.status]}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => setViewingQrCode(item.code)}
                >
                  QR 보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">사용/처리 내역 ({used.length})</h3>
        <div className="flex flex-col gap-2">
          {used.length === 0 ? (
            <p className="text-xs text-muted-foreground">사용 내역이 없습니다.</p>
          ) : null}
          {used.map((item) => (
            <div
              key={item.code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-4 py-2 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono">{item.code}</span>
                <span className="text-[10px] text-muted-foreground">생성: {formatDate(item)}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.amount != null ? (
                  <span className="text-xs text-muted-foreground">{item.amount} ZTRO</span>
                ) : null}
                {item.txHash ? (
                  <a
                    href={`https://opbnbscan.com/tx/${item.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline underline-offset-4 mr-1"
                  >
                    tx 보기
                  </a>
                ) : null}
                <Badge
                  variant={item.status === "used" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {STATUS_LABEL[item.status]}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => setViewingQrCode(item.code)}
                >
                  QR 보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewingQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-lg border border-border/60 p-6 flex flex-col items-center gap-4 text-center shadow-xl">
            <h3 className="font-display text-sm font-semibold">QR 코드 리워드</h3>
            <div className="rounded-md border border-border/40 p-3 bg-white">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(viewingQrCode)}`}
                alt={viewingQrCode}
                className="w-48 h-48"
              />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{viewingQrCode}</p>
            <Button size="sm" onClick={() => setViewingQrCode(null)} className="w-full mt-2">
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
