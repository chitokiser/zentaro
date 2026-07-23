"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  fetchExchangeDashboard,
  stakeZtro,
  unstakeZtro,
  type ExchangeDashboard,
} from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"
import type { Dict } from "@/lib/i18n/translations"

function remainingLabel(unlockAtSec: number, e: Dict["exchange"]): string {
  if (!unlockAtSec) return "-"
  const diff = unlockAtSec - Date.now() / 1000
  if (diff <= 0) return e.unstakeAvailableNow
  const days = Math.ceil(diff / 86400)
  return `${days}${e.daysRemainingSuffix}`
}

// EXP staking rewards are paid out weekly by a server cron job at 00:00 UTC every Sunday (token-exchange.service.ts).
function nextWeeklyDistributionUtc(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  while (d.getUTCDay() !== 0 || d.getTime() <= now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return d
}

function formatCountdown(targetMs: number, nowMs: number, e: Dict["exchange"]): string {
  const diff = Math.max(0, targetMs - nowMs)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${days}${e.countdownDaySuffix} ${hours}${e.countdownHourSuffix} ${minutes}${e.countdownMinuteSuffix} ${seconds}${e.countdownSecondSuffix}`
}

export default function ExchangePage() {
  const { t } = useI18n()
  const e = t.exchange
  const [dashboard, setDashboard] = useState<ExchangeDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [stakeAmount, setStakeAmount] = useState(1)
  const [now, setNow] = useState(() => Date.now())
  const [walletBusy, setWalletBusy] = useState(false)

  const load = useCallback(() => {
    fetchExchangeDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : e.genericError))
  }, [e.genericError])

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
      setActionMessage(e.processingDone)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : e.processingError)
    } finally {
      setBusy(null)
    }
  }

  function handleStake() {
    runAction("stake", () => stakeZtro(stakeAmount))
  }
  function handleUnstake() {
    runAction("unstake", () => unstakeZtro())
  }

  async function copyAddress() {
    if (!dashboard) return
    await navigator.clipboard.writeText(dashboard.address)
    setActionMessage(e.addressCopied)
  }

  // Wallet creation is handled automatically/idempotently by the server when the dashboard is fetched — passes through if one already exists.
  async function handleCreateWallet() {
    setWalletBusy(true)
    setActionError(null)
    try {
      const data = await fetchExchangeDashboard()
      setDashboard(data)
      setActionMessage(e.walletReady)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : e.walletCreateError)
    } finally {
      setWalletBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={e.eyebrow}
        title={e.title}
        description={e.description}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {error === "로그인이 필요합니다." ? (
          <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            {e.loginRequired}{" "}
            <Link href="/my/profile" className="text-primary underline underline-offset-4">
              {e.loginCta}
            </Link>
          </div>
        ) : !dashboard ? (
          error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{e.loading}</p>
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

            {/* Staking info */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {e.stakingInfo}
              </p>
            </div>

            {/* Custodial wallet */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">{e.custodialWalletTitle}</h3>
              {dashboard.address ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-emerald-500">{e.custodialWalletExists}</span>
                  <span className="font-mono text-xs text-muted-foreground break-all">
                    {dashboard.address}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={copyAddress}>
                    {e.copyAddress}
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
                    {walletBusy ? e.creatingWallet : e.createWalletButton}
                  </Button>
                </div>
              )}
            </div>

            {/* Balance / position */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{e.ztroBalanceLabel}</p>
                <p className="font-semibold">{dashboard.ztroBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{e.stakedAmountLabel}</p>
                <p className="font-semibold">{dashboard.staked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{e.unstakeCountdownLabel}</p>
                <p className="font-semibold">
                  {dashboard.staked > 0
                    ? remainingLabel(dashboard.stakingTime + dashboard.stakeLockSeconds, e)
                    : "-"}
                </p>
              </div>
            </div>

            {/* Weekly EXP dividend */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{e.weeklyExpDividendLabel}</p>
                <p className="font-semibold text-primary">
                  {Math.floor(dashboard.staked / 100).toLocaleString()} <span className="notranslate">EXP</span>
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {e.weeklyExpDividendNote}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{e.nextDividendLabel}</p>
                <p className="font-semibold">
                  {formatCountdown(nextWeeklyDistributionUtc(new Date(now)).getTime(), now, e)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {e.nextDividendNote}
                </p>
              </div>
            </div>

            {/* Staking */}
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">{e.stakeSectionTitle}</h3>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {e.amountLabel}
                  <input
                    type="number"
                    min={1}
                    value={stakeAmount}
                    onChange={(ev) => setStakeAmount(Number(ev.target.value))}
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
                  {busy === "stake" ? e.processing : e.stakeButton}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy === "unstake" || dashboard.staked <= 0}
                  onClick={handleUnstake}
                >
                  {busy === "unstake" ? e.processing : e.unstakeButton}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
