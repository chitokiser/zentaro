"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchWallet, fetchMyDeposits, submitDepositRequest, fetchExchangeDashboard, convertZpToExp, depositUsdt, withdrawUsdt, type ExchangeDashboard, type DepositRequest } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"

interface WalletData {
  ap: number
  exp: number
  timeToken: number
  jumpToken: number
  rewardPoint: number
  tickets: string[]
  nfts: string[]
}

export default function WalletPage() {
  const { t } = useI18n()
  const w = t.myPage.wallet
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [dashboard, setDashboard] = useState<ExchangeDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ZP Top-up UI States
  const [zpAmount, setZpAmount] = useState<number>(10000)
  const [depositorName, setDepositorName] = useState<string>("")
  const [currency, setCurrency] = useState<'VND' | 'KRW'>("VND")
  const [usdRate, setUsdRate] = useState<number>(25420.5) // default VND rate
  const [krwRate, setKrwRate] = useState<number>(1395.2) // default KRW rate
  const [ratesLoading, setRatesLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([])
  const [recentResult, setRecentResult] = useState<{ refCode: string; zpAmount: number; currency: 'VND' | 'KRW'; estimatedAmount: number } | null>(null)
  const [addressCopied, setAddressCopied] = useState(false)

  // ZP -> EXP 1:1 conversion
  const [convertAmount, setConvertAmount] = useState<number>(10000)
  const [convertBusy, setConvertBusy] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null)

  // USDT auto top-up
  const [usdtBusy, setUsdtBusy] = useState(false)
  const [usdtError, setUsdtError] = useState<string | null>(null)
  const [usdtSuccess, setUsdtSuccess] = useState<string | null>(null)

  // USDT withdrawal (ZP -> USDT, 3% fee)
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10000)
  const [withdrawBusy, setWithdrawBusy] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWalletData()
    fetchRates()
    loadDepositHistory()
  }, [])

  const loadWalletData = () => {
    Promise.all([fetchWallet(), fetchExchangeDashboard()])
      .then(([wData, dData]) => {
        setWallet(wData)
        setDashboard(dData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : w.convertGenericError))
  }

  const fetchRates = () => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          if (data.rates.VND) setUsdRate(data.rates.VND)
          if (data.rates.KRW) setKrwRate(data.rates.KRW)
        }
        setRatesLoading(false)
      })
      .catch((e) => {
        console.error("Exchange rate fetch error, using fallbacks:", e)
        setRatesLoading(false)
      })
  }

  const copyAddress = async () => {
    if (!dashboard) return
    await navigator.clipboard.writeText(dashboard.address)
    setAddressCopied(true)
    setTimeout(() => setAddressCopied(false), 2000)
  }

  const loadDepositHistory = () => {
    fetchMyDeposits()
      .then((data) => setDepositRequests(data))
      .catch((err) => console.error("Deposits fetch error:", err))
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (zpAmount < 10000) {
      alert(w.minAmountAlert)
      return
    }
    if (!depositorName.trim()) {
      alert(w.depositorNameRequiredAlert)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitDepositRequest({
        zpAmount,
        depositorName,
        currency,
      })

      const estimatedAmount = currency === "VND"
        ? Math.round((zpAmount / 10000) * usdRate)
        : Math.round((zpAmount / 10000) * krwRate)

      setRecentResult({
        refCode: result.refCode,
        zpAmount,
        currency,
        estimatedAmount,
      })

      alert(`${w.depositSuccessAlertPrefix}${result.refCode}`)
      setDepositorName("")
      loadDepositHistory()
    } catch (err) {
      alert(err instanceof Error ? err.message : w.depositErrorAlert)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvert = async () => {
    if (!wallet) return
    if (!Number.isInteger(convertAmount) || convertAmount <= 0) {
      setConvertError(w.convertAmountErrorMin)
      return
    }
    if (convertAmount > wallet.ap) {
      setConvertError(`${w.convertAmountErrorMaxPrefix}${wallet.ap.toLocaleString()}${w.convertAmountErrorMaxSuffix}`)
      return
    }
    if (!confirm(`${w.convertConfirmPrefix}${convertAmount.toLocaleString()}${w.convertConfirmSuffix}`)) return

    setConvertBusy(true)
    setConvertError(null)
    setConvertSuccess(null)
    try {
      await convertZpToExp(convertAmount)
      setConvertSuccess(`${convertAmount.toLocaleString()}${w.convertSuccessMiddle}${convertAmount.toLocaleString()}${w.convertSuccessSuffix}`)
      loadWalletData()
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : w.convertGenericError)
    } finally {
      setConvertBusy(false)
    }
  }

  const handleUsdtDeposit = async () => {
    setUsdtBusy(true)
    setUsdtError(null)
    setUsdtSuccess(null)
    try {
      const result = await depositUsdt()
      setUsdtSuccess(`${w.usdtSuccessPrefix}${result.usdtAmount}${w.usdtSuccessMiddle}${result.zpCredited.toLocaleString()}${w.usdtSuccessSuffix}`)
      loadWalletData()
      loadDepositHistory()
    } catch (err) {
      setUsdtError(err instanceof Error ? err.message : w.usdtErrorGeneric)
    } finally {
      setUsdtBusy(false)
    }
  }

  const handleUsdtWithdraw = async () => {
    if (!wallet) return
    if (!Number.isInteger(withdrawAmount) || withdrawAmount < 10000) {
      setWithdrawError(w.usdtWithdrawMinAlert)
      return
    }
    if (withdrawAmount > wallet.ap) {
      setWithdrawError(w.usdtWithdrawInsufficientAlert)
      return
    }
    setWithdrawBusy(true)
    setWithdrawError(null)
    setWithdrawSuccess(null)
    try {
      const result = await withdrawUsdt(withdrawAmount)
      setWithdrawSuccess(`${w.usdtWithdrawSuccessPrefix}${withdrawAmount.toLocaleString()}${w.usdtWithdrawSuccessMiddle}${result.netUsdt.toFixed(4)}${w.usdtWithdrawSuccessSuffix}`)
      loadWalletData()
      loadDepositHistory()
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : w.usdtWithdrawErrorGeneric)
    } finally {
      setWithdrawBusy(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          {w.loginCta}
        </Link>
      </div>
    )
  }

  if (!wallet) {
    return <p className="text-sm text-muted-foreground">{w.loading}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground">{w.zpLabel}</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {wallet.ap.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            ≈ {Math.round((wallet.ap / 10000) * usdRate).toLocaleString()} VND
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground notranslate">EXP</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {wallet.exp.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground">{w.ztroLabel}</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {dashboard ? dashboard.ztroBalance.toLocaleString() : "0"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground">{w.ztroStakedLabel}</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {dashboard ? dashboard.staked.toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* ZP -> EXP 1:1 conversion */}
      <div className="rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">ZP → <span className="notranslate">EXP</span> {w.convertTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {w.convertDescription}
          </p>
        </div>
        {convertError ? <p className="text-xs text-destructive">{convertError}</p> : null}
        {convertSuccess ? <p className="text-xs text-emerald-500">{convertSuccess}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            step={1000}
            value={convertAmount}
            onChange={(e) => setConvertAmount(Number(e.target.value))}
            className="w-40 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">ZP → {convertAmount.toLocaleString()} <span className="notranslate">EXP</span></span>
          <button
            type="button"
            disabled={convertBusy}
            onClick={handleConvert}
            className="bg-primary text-primary-foreground hover:bg-primary/95 font-medium text-xs rounded-md px-4 py-2 transition active:scale-[0.98] disabled:opacity-50"
          >
            {convertBusy ? w.convertingButton : w.convertButton}
          </button>
        </div>
      </div>

      {/* Custodial wallet address */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <span className="text-xs text-muted-foreground">{w.walletAddressLabel}</span>
        {dashboard ? (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs break-all text-foreground">{dashboard.address}</p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 text-xs bg-secondary border border-border hover:bg-secondary/80 font-medium rounded-md px-2.5 py-1 text-muted-foreground transition"
            >
              {addressCopied ? w.addressCopied : w.addressCopy}
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{w.loading}</p>
        )}
      </div>

      {/* USDT auto top-up */}
      <div className="rounded-lg border border-primary/30 bg-card p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground notranslate">{w.usdtSectionTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{w.usdtSectionDescription}</p>
        </div>
        {usdtError ? <p className="text-xs text-destructive">{usdtError}</p> : null}
        {usdtSuccess ? <p className="text-xs text-emerald-500">{usdtSuccess}</p> : null}
        <button
          type="button"
          disabled={usdtBusy}
          onClick={handleUsdtDeposit}
          className="self-start bg-primary text-primary-foreground hover:bg-primary/95 font-medium text-xs rounded-md px-4 py-2 transition active:scale-[0.98] disabled:opacity-50"
        >
          {usdtBusy ? w.usdtDepositing : w.usdtDepositButton}
        </button>
      </div>

      {/* USDT withdrawal (ZP -> USDT, 3% fee) */}
      <div className="rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground notranslate">{w.usdtWithdrawSectionTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{w.usdtWithdrawSectionDescription}</p>
        </div>
        {withdrawError ? <p className="text-xs text-destructive">{withdrawError}</p> : null}
        {withdrawSuccess ? <p className="text-xs text-emerald-500">{withdrawSuccess}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{w.usdtWithdrawAmountLabel}</span>
            <input
              type="number"
              min={10000}
              step={1000}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              className="w-40 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <span className="text-xs text-muted-foreground">
            {w.usdtWithdrawEstimateLabel} <span className="text-primary font-semibold notranslate">{((withdrawAmount / 10000) * 0.97).toFixed(4)} USDT</span>
          </span>
        </div>
        <button
          type="button"
          disabled={withdrawBusy}
          onClick={handleUsdtWithdraw}
          className="self-start bg-primary text-primary-foreground hover:bg-primary/95 font-medium text-xs rounded-md px-4 py-2 transition active:scale-[0.98] disabled:opacity-50"
        >
          {withdrawBusy ? w.usdtWithdrawing : w.usdtWithdrawButton}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ZP top-up request card */}
        <div className="lg:col-span-2 rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-display text-lg font-medium text-foreground">{w.depositTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {w.depositDescription}
            </p>
          </div>

          {/* Live exchange rate & account info */}
          <div className="bg-secondary/40 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-primary mb-2">{w.rateTitle}</h4>
              <ul className="space-y-1 text-muted-foreground mono">
                <li>🇻🇳 10,000 ZP = {usdRate.toLocaleString(undefined, { maximumFractionDigits: 1 })} VND</li>
                <li>🇰🇷 10,000 ZP = {krwRate.toLocaleString(undefined, { maximumFractionDigits: 1 })} KRW</li>
              </ul>
              {ratesLoading && <span className="text-[10px] text-muted-foreground/60">{w.rateUpdating}</span>}
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">{w.accountInfoTitle}</h4>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground block">🇻🇳 {w.vndBankLabel}</span>
                  <span>19037852768012 / 예금주: SHIN HEON CHEOL</span>
                </div>
                <hr className="border-border/30" />
                <div>
                  <span className="font-medium text-foreground block">🇰🇷 {w.krwBankLabel}</span>
                  <span>381. 19. 03076. 2 / 예금주: 오용진</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">{w.zpAmountLabel}</span>
                <input
                  type="number"
                  min={10000}
                  step={1000}
                  value={zpAmount}
                  onChange={(e) => setZpAmount(Number(e.target.value))}
                  placeholder={w.zpAmountPlaceholder}
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">{w.depositorNameLabel}</span>
                <input
                  type="text"
                  maxLength={20}
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder={w.depositorNamePlaceholder}
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">{w.currencyLabel}</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="currency"
                    checked={currency === "VND"}
                    onChange={() => setCurrency("VND")}
                    className="accent-primary"
                  />
                  🇻🇳 {w.vndOption}
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="currency"
                    checked={currency === "KRW"}
                    onChange={() => setCurrency("KRW")}
                    className="accent-primary"
                  />
                  🇰🇷 {w.krwOption}
                </label>
              </div>
            </div>

            {/* Live estimated amount */}
            <div className="bg-secondary/20 border border-border/40 rounded-lg p-3 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{w.estimatedLabel}</span>
              <span className="font-semibold text-primary">
                {currency === "VND"
                  ? `${Math.round((zpAmount / 10000) * usdRate).toLocaleString()} VND`
                  : `${Math.round((zpAmount / 10000) * krwRate).toLocaleString()} KRW`}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/95 font-medium text-sm rounded-md py-2.5 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? w.submitting : w.submitButton}
            </button>
          </form>
        </div>

        {/* Deposit guidance / submission result */}
        <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-4">
          <h3 className="font-display text-sm font-semibold text-foreground border-b border-border/50 pb-2">{w.recentResultTitle}</h3>
          {recentResult ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-md">
                {w.recentResultSuccess}
              </div>
              <div className="space-y-2 text-muted-foreground bg-secondary/20 p-3 rounded-md">
                <div className="flex justify-between"><span>{w.refCodeLabel}</span><span className="font-mono text-foreground font-semibold selection:bg-primary selection:text-primary-foreground">{recentResult.refCode}</span></div>
                <div className="flex justify-between"><span>{w.depositZpLabel}</span><span className="text-foreground">{recentResult.zpAmount.toLocaleString()} ZP</span></div>
                <div className="flex justify-between"><span>{w.depositAmountLabel}</span><span className="font-semibold text-white">{recentResult.estimatedAmount.toLocaleString()} {recentResult.currency}</span></div>
                <div className="flex justify-between"><span>{w.depositBankLabel}</span><span className="text-foreground">{recentResult.currency === "VND" ? "TECHCOM BANK" : "하나은행"}</span></div>
                <div className="flex justify-between"><span>{w.accountNumberLabel}</span><span className="text-foreground font-mono">{recentResult.currency === "VND" ? "19037852768012" : "381. 19. 03076. 2"}</span></div>
                <div className="flex justify-between"><span>{w.accountHolderLabel}</span><span className="text-foreground">{recentResult.currency === "VND" ? "신헌철 (SHIN HEON CHEOL)" : "오용진"}</span></div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {w.matchNote}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 border border-dashed border-border/40 rounded-lg text-xs text-muted-foreground">
              {w.recentResultEmpty}
            </div>
          )}
        </div>
      </div>

      {/* Top-up history table */}
      <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-border/50">
          <h3 className="font-display text-sm font-semibold text-foreground">{w.historyTitle}</h3>
          <button
            onClick={loadDepositHistory}
            className="text-xs bg-secondary border border-border hover:bg-secondary/80 font-medium rounded-md px-2.5 py-1 text-muted-foreground transition"
          >
            {w.refresh}
          </button>
        </div>

        {depositRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="py-2.5 font-medium">{w.tableDate}</th>
                  <th className="py-2.5 font-medium">{w.tableRefCode}</th>
                  <th className="py-2.5 font-medium">{w.tableDepositor}</th>
                  <th className="py-2.5 font-medium">{w.tableZp}</th>
                  <th className="py-2.5 font-medium">{w.tableAmount}</th>
                  <th className="py-2.5 font-medium">{w.tableCurrency}</th>
                  <th className="py-2.5 font-medium">{w.tableStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-muted-foreground">
                {depositRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-secondary/10">
                    <td className="py-2.5 font-mono">{req.createdAt ? new Date(req.createdAt._seconds * 1000).toLocaleString() : "-"}</td>
                    <td className="py-2.5 font-mono font-semibold text-foreground">{req.refCode}</td>
                    <td className="py-2.5">{req.depositorName}</td>
                    <td className="py-2.5 font-semibold text-primary">{req.zpAmount.toLocaleString()} ZP</td>
                    <td className="py-2.5">
                      {req.currency === "VND"
                        ? `${Math.round((req.zpAmount / 10000) * 25420.5).toLocaleString()} VND`
                        : req.currency === "KRW"
                        ? `${Math.round((req.zpAmount / 10000) * 1395.2).toLocaleString()} KRW`
                        : `${req.usdtAmount ?? (req.zpAmount / 10000)} USDT`
                      }
                    </td>
                    <td className="py-2.5">{req.currency}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {req.status === 'approved' ? w.statusApproved :
                          req.status === 'rejected' ? w.statusRejected :
                            w.statusPending}
                      </span>
                      {req.rejectReason && (
                        <span className="block text-[10px] text-red-400 mt-0.5">{w.rejectReasonLabel} {req.rejectReason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">{w.historyEmpty}</p>
        )}
      </div>
    </div>
  )
}
