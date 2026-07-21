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

  const load = useCallback(() => {
    fetchExchangeDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="토큰거래소"
        description="USDT로 ZTRO를 매수·매도하고, 스테이킹으로 배당을 받으세요."
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
              <h3 className="font-display text-base font-medium">내 수탁지갑 (입금 주소)</h3>
              <p className="mt-1 font-mono text-xs break-all text-foreground">{dashboard.address}</p>
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                반드시 opBNB 네트워크의 USDT만 이 주소로 보내세요. 다른 네트워크의 USDT를
                보내면 복구할 수 없습니다.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={copyAddress}>
                주소 복사
              </Button>
            </div>

            {/* 잔액/포지션 */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">보유 ZTRO</p>
                <p className="font-semibold">{dashboard.ztroBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">보유 USDT</p>
                <p className="font-semibold">{dashboard.usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">현재가</p>
                <p className="font-semibold text-primary">{dashboard.priceUsdt.toFixed(4)} USDT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">스테이킹 수량</p>
                <p className="font-semibold">{dashboard.staked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">평균 매수가</p>
                <p className="font-semibold">{dashboard.avgBuyPriceUsdt.toFixed(4)} USDT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">수익률</p>
                <p className={`font-semibold ${dashboard.roiBps >= 0 ? "text-primary" : "text-destructive"}`}>
                  {(dashboard.roiBps / 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">미수령 배당</p>
                <p className="font-semibold">{dashboard.pendingDividendUsdt.toFixed(4)} USDT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">언스테이킹까지</p>
                <p className="font-semibold">
                  {dashboard.staked > 0
                    ? remainingLabel(dashboard.stakingTime + dashboard.stakeLockSeconds)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">배당 청구까지</p>
                <p className="font-semibold">
                  {dashboard.staked > 0
                    ? remainingLabel(dashboard.lastClaim + dashboard.divIntervalSeconds)
                    : "-"}
                </p>
              </div>
            </div>

            {/* 매수/매도 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={tab === "buy" ? "default" : "outline"}
                  onClick={() => setTab("buy")}
                >
                  매수
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tab === "sell" ? "default" : "outline"}
                  onClick={() => setTab("sell")}
                >
                  매도
                </Button>
              </div>

              {tab === "buy" ? (
                <div className="mt-4 flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    구매 수량 (ZTRO)
                    <input
                      type="number"
                      min={1}
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(Number(e.target.value))}
                      className="w-40 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    예상 결제: {(buyAmount * dashboard.priceUsdt).toFixed(4)} USDT
                  </p>
                  <Button
                    type="button"
                    disabled={busy === "buy"}
                    onClick={handleBuy}
                    className="self-start bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {busy === "buy" ? "처리 중..." : "매수"}
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    매도 수량 (ZTRO)
                    <input
                      type="number"
                      min={1}
                      value={sellAmount}
                      onChange={(e) => setSellAmount(Number(e.target.value))}
                      className="w-40 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    수수료 {dashboard.sellFeePercent}% 차감 후 지급
                  </p>
                  <Button
                    type="button"
                    disabled={busy === "sell"}
                    onClick={handleSell}
                    variant="outline"
                    className="self-start"
                  >
                    {busy === "sell" ? "처리 중..." : "매도"}
                  </Button>
                </div>
              )}
            </div>

            {/* 스테이킹 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">스테이킹</h3>
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

            {/* 배당 */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">이자배당</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                미수령 배당: {dashboard.pendingDividendUsdt.toFixed(4)} USDT
              </p>
              <Button
                type="button"
                size="sm"
                disabled={busy === "claim" || dashboard.pendingDividendUsdt <= 0}
                onClick={handleClaim}
                className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy === "claim" ? "처리 중..." : "배당 청구"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
