"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  fetchExchangeDashboard,
  buyZtro,
  sellZtro,
  stakeZtro,
  unstakeZtro,
  claimZtroDividend,
  type ExchangeDashboard,
} from "@/lib/auth-client"

function remainingLabel(unlockAtSec: number): string {
  if (!unlockAtSec) return "-"
  const diff = unlockAtSec - Date.now() / 1000
  if (diff <= 0) return "지금 가능"
  const days = Math.ceil(diff / 86400)
  return `${days}일 남음`
}

// EXP 스테이킹 보상은 매주 일요일 00:00 UTC에 서버 크론으로 지급됩니다 (token-exchange.service.ts).
function nextWeeklyDistributionUtc(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  while (d.getUTCDay() !== 0 || d.getTime() <= now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return d
}

function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = Math.max(0, targetMs - nowMs)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`
}

export default function ExchangePage() {
  const [dashboard, setDashboard] = useState<ExchangeDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [tab, setTab] = useState<"buy" | "sell">("buy")
  const [buyAmount, setBuyAmount] = useState(1)
  const [sellAmount, setSellAmount] = useState(1)
  const [stakeAmount, setStakeAmount] = useState(1)
  const [now, setNow] = useState(() => Date.now())
  const [walletBusy, setWalletBusy] = useState(false)

  const load = useCallback(() => {
    fetchExchangeDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function runAction(name: string, fn: () => Promise<unknown>) {
    setBusy(name)
    setActionMessage(null)
    setActionError(null)
    try {
      await fn()
      setActionMessage("처리 완료")
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "처리에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  function handleBuy() {
    const maxPayUsdt = dashboard ? buyAmount * dashboard.priceUsdt * 1.02 : undefined
    runAction("buy", () => buyZtro(buyAmount, maxPayUsdt))
  }
  function handleSell() {
    runAction("sell", () => sellZtro(sellAmount))
  }
  function handleStake() {
    runAction("stake", () => stakeZtro(stakeAmount))
  }
  function handleUnstake() {
    runAction("unstake", () => unstakeZtro())
  }
  function handleClaim() {
    runAction("claim", () => claimZtroDividend())
  }

  async function copyAddress() {
    if (!dashboard) return
    await navigator.clipboard.writeText(dashboard.address)
    setActionMessage("주소를 복사했습니다.")
  }

  // 지갑 생성은 서버에서 대시보드 조회 시 자동/멱등으로 처리됨 — 이미 있으면 그대로 통과.
  async function handleCreateWallet() {
    setWalletBusy(true)
    setActionError(null)
    try {
      const data = await fetchExchangeDashboard()
      setDashboard(data)
      setActionMessage("수탁지갑이 준비되었습니다.")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "지갑 생성에 실패했습니다.")
    } finally {
      setWalletBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="ZTRO 토큰 혜택"
        description="ZTRO를 스테이킹하고 젠타로 생태계의 다양한 혜택을 누리세요."
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {error === "로그인이 필요합니다." ? (
          <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            로그인이 필요합니다.{" "}
            <Link href="/my/profile" className="text-primary underline underline-offset-4">
              로그인 하러가기
            </Link>
          </div>
        ) : !dashboard ? (
          error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )
        ) : (
          <div className="flex flex-col gap-8">
            {actionMessage ? (
              <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
                {actionMessage}
              </p>
            ) : null}
            {actionError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {actionError}
              </p>
            ) : null}

            {/* 입금 안내 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                가지고 있는 ZTRO 토큰을 스테이킹 하세요. 매주 스테이킹한 토큰에 비례하여 EXP를 지급받습니다. 스테이킹한 수량에 따라 그 외 다양한 혜택을 받을 수 있습니다.
              </p>
            </div>

            {/* 수탁지갑 발급 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">수탁지갑</h3>
              {dashboard.address ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-emerald-500">이미 발급된 수탁지갑이 있습니다.</span>
                  <span className="font-mono text-xs text-muted-foreground break-all">
                    {dashboard.address}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={copyAddress}>
                    주소 복사
                  </Button>
                </div>
              ) : (
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={walletBusy}
                    onClick={handleCreateWallet}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {walletBusy ? "생성 중..." : "수탁지갑 생성하기"}
                  </Button>
                </div>
              )}
            </div>

            {/* 잔액/포지션 */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">보유 ZTRO</p>
                <p className="font-semibold">{dashboard.ztroBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">스테이킹 수량</p>
                <p className="font-semibold">{dashboard.staked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">언스테이킹까지</p>
                <p className="font-semibold">
                  {dashboard.staked > 0
                    ? remainingLabel(dashboard.stakingTime + dashboard.stakeLockSeconds)
                    : "-"}
                </p>
              </div>
            </div>

            {/* 이번주 EXP 배당 */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">이번주 예상 EXP 배당</p>
                <p className="font-semibold text-primary">
                  {Math.floor(dashboard.staked / 100).toLocaleString()} EXP
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  (스테이킹 10,000 ZTRO당 100 EXP 기준)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">다음 배당까지</p>
                <p className="font-semibold">
                  {formatCountdown(nextWeeklyDistributionUtc(new Date(now)).getTime(), now)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  (베트남 시간 기준 매주 일요일 오전 7시 지급)
                </p>
              </div>
            </div>

            {/* 스테이킹 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">ZTRO 스테이킹</h3>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  수량 (ZTRO)
                  <input
                    type="number"
                    min={1}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-40 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === "stake"}
                  onClick={handleStake}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {busy === "stake" ? "처리 중..." : "스테이킹"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy === "unstake" || dashboard.staked <= 0}
                  onClick={handleUnstake}
                >
                  {busy === "unstake" ? "처리 중..." : "언스테이킹"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
