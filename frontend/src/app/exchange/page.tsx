"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { ZtroPoolInfo } from "@/components/ztro-pool-info"
import { ZtroChartWidget } from "@/components/ztro-chart-widget"
import { Button } from "@/components/ui/button"
import {
  fetchExchangeDashboard,
  stakeZtro,
  unstakeZtro,
  transferOutZtro,
  fetchMe,
  type ExchangeDashboard,
} from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"
import { PaymentPinDialog } from "@/components/payment-pin-dialog"
import type { Dict } from "@/lib/i18n/translations"

function remainingLabel(unlockAtSec: number, e: Dict["exchange"]): string {
  if (!unlockAtSec) return "-"
  const diff = unlockAtSec - Date.now() / 1000
  if (diff <= 0) return e.unstakeAvailableNow
  const days = Math.ceil(diff / 86400)
  return `${days}${e.daysRemainingSuffix}`
}

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
  const [stakeMonths, setStakeMonths] = useState(3)
  const [transferRecipients, setTransferRecipients] = useState<Record<number, string>>({})
  const [now, setNow] = useState(() => Date.now())
  const [walletBusy, setWalletBusy] = useState(false)

  // PIN Dialog States
  const [isPinOpen, setIsPinOpen] = useState(false)
  const [hasPinSet, setHasPinSet] = useState(true)
  const [pendingStakeId, setPendingStakeId] = useState<number | null>(null)
  const [pendingRecipient, setPendingRecipient] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchExchangeDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : e.genericError))
    fetchMe()
      .then((me) => setHasPinSet(me.hasPaymentPassword))
      .catch((err) => console.error("Me fetch error:", err))
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
    runAction("stake", () => stakeZtro(stakeAmount, stakeMonths))
  }

  function handleUnstakeItem(stakeId: number) {
    runAction(`unstake_${stakeId}`, () => unstakeZtro(stakeId))
  }

  function handleTransferItem(stakeId: number) {
    const recipient = transferRecipients[stakeId]?.trim()
    if (!recipient) {
      setActionError("이체 받을 지갑 주소를 입력해주세요.")
      return
    }
    setPendingStakeId(stakeId)
    setPendingRecipient(recipient)
    setIsPinOpen(true)
  }

  async function executeTransferOut(paymentPassword?: string) {
    if (pendingStakeId === null || !pendingRecipient) return

    await runAction(`transfer_${pendingStakeId}`, () =>
      transferOutZtro(pendingStakeId, pendingRecipient, paymentPassword)
    )
    setIsPinOpen(false)
    setPendingStakeId(null)
    setPendingRecipient(null)
  }

  async function copyAddress() {
    if (!dashboard) return
    await navigator.clipboard.writeText(dashboard.address)
    setActionMessage(e.addressCopied)
  }

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

  const activeStakes = dashboard?.stakes?.filter((s) => s.active) || []
  const nextUnlockStake = activeStakes.length > 0
    ? Math.min(...activeStakes.map((s) => s.lockedUntil))
    : 0

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

            {/* ZTRO Pool Live Data */}
            <ZtroPoolInfo />

            {/* ZTRO Live Chart */}
            <ZtroChartWidget />

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
                  {activeStakes.length > 0
                    ? remainingLabel(nextUnlockStake, e)
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
              <div className="mt-3 flex flex-wrap items-end gap-3">
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

                {/* Duration Dropdown */}
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {e.lockMonthsLabel}
                  <select
                    value={stakeMonths}
                    onChange={(ev) => setStakeMonths(Number(ev.target.value))}
                    className="w-40 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((m) => (
                      <option key={m} value={m}>
                        {m}
                        {e.monthsSuffix}
                      </option>
                    ))}
                  </select>
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
              </div>
            </div>

            {/* My Staking Positions */}
            {dashboard.stakes && dashboard.stakes.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-5">
                <h3 className="font-display text-base font-medium mb-3">{e.myStakesTitle}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground">
                        <th className="py-2 pr-2">{e.stakeIdCol}</th>
                        <th className="py-2 px-2">{e.stakedAmountCol}</th>
                        <th className="py-2 px-2">{e.createdAtCol}</th>
                        <th className="py-2 px-2">{e.lockedUntilCol}</th>
                        <th className="py-2 px-2">{e.statusCol}</th>
                        <th className="py-2 pl-2 text-right">{e.actionsCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.stakes.map((stake) => {
                        const stakeLocked = now / 1000 < stake.lockedUntil
                        let statusText = e.statusActive
                        if (stake.transferred) {
                          statusText = e.statusTransferred
                        } else if (stake.unstaked) {
                          statusText = e.statusUnstaked
                        }

                        return (
                          <tr key={stake.stakeId} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                            <td className="py-3 pr-2 font-mono">{stake.stakeId}</td>
                            <td className="py-3 px-2 font-semibold">
                              {stake.amount.toLocaleString()} ZTRO
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(stake.createdAt * 1000).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(stake.lockedUntil * 1000).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${stake.transferred
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : stake.unstaked
                                    ? "bg-orange-500/10 text-orange-500"
                                    : stakeLocked
                                      ? "bg-blue-500/10 text-blue-500"
                                      : "bg-primary/10 text-primary"
                                  }`}
                              >
                                {statusText}
                              </span>
                            </td>
                            <td className="py-3 pl-2 text-right">
                              {stake.active && (
                                <div>
                                  {stakeLocked ? (
                                    <span className="text-[10px] text-muted-foreground">
                                      {remainingLabel(stake.lockedUntil, e)}
                                    </span>
                                  ) : dashboard.withdrawApproved ? (
                                    <Button
                                      type="button"
                                      size="xs"
                                      disabled={busy === `unstake_${stake.stakeId}`}
                                      onClick={() => handleUnstakeItem(stake.stakeId)}
                                    >
                                      {busy === `unstake_${stake.stakeId}` ? e.processing : e.unstakeButton}
                                    </Button>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <Button
                                        type="button"
                                        size="xs"
                                        disabled
                                        variant="outline"
                                        className="text-muted-foreground"
                                      >
                                        {e.unstakeButton}
                                      </Button>
                                      <span className="text-[9px] text-destructive">
                                        {e.unstakePendingApproval}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!stake.active && stake.unstaked && !stake.transferred && (
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="text"
                                    placeholder={e.transferRecipientPlaceholder}
                                    value={transferRecipients[stake.stakeId] || ""}
                                    onChange={(ev) =>
                                      setTransferRecipients((prev) => ({
                                        ...prev,
                                        [stake.stakeId]: ev.target.value,
                                      }))
                                    }
                                    className="w-32 rounded border border-border/60 bg-background px-2 py-0.5 text-[10px] text-foreground h-6"
                                  />
                                  {dashboard.transferApproved ? (
                                    <Button
                                      type="button"
                                      size="xs"
                                      className="h-6 text-[10px] px-2"
                                      disabled={busy === `transfer_${stake.stakeId}`}
                                      onClick={() => handleTransferItem(stake.stakeId)}
                                    >
                                      {busy === `transfer_${stake.stakeId}` ? e.processing : e.transferButton}
                                    </Button>
                                  ) : (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <Button
                                        type="button"
                                        size="xs"
                                        disabled
                                        variant="outline"
                                        className="h-6 text-[10px] px-2 text-muted-foreground"
                                      >
                                        {e.transferButton}
                                      </Button>
                                      <span className="text-[8px] text-destructive">
                                        {e.transferPendingApproval}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PaymentPinDialog
        isOpen={isPinOpen}
        onClose={() => {
          setIsPinOpen(false)
          setPendingStakeId(null)
          setPendingRecipient(null)
        }}
        onSuccess={executeTransferOut}
        title="ZTRO 외부 이체 승인"
        description={pendingRecipient ? `ZTRO 지갑 이체(${pendingRecipient.substring(0, 6)}...)를 완료하기 위해 6자리 결제 비밀번호를 입력해주세요.` : ""}
        hasPinSet={hasPinSet}
        onPinSetSuccess={() => setHasPinSet(true)}
      />
    </div>
  )
}
