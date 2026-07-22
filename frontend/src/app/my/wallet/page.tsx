"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchWallet, fetchMyDeposits, submitDepositRequest, fetchExchangeDashboard, type ExchangeDashboard, type DepositRequest } from "@/lib/auth-client"

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
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
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
      alert("최소 10,000 ZP 이상부터 충전 신청이 가능합니다.")
      return
    }
    if (!depositorName.trim()) {
      alert("입금자명을 입력해 주세요.")
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

      alert(`충전 신청이 접수되었습니다.\n참조코드: ${result.refCode}`)
      setDepositorName("")
      loadDepositHistory()
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          로그인 하러가기
        </Link>
      </div>
    )
  }

  if (!wallet) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground">ZP</span>
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
          <span className="text-xs text-muted-foreground">ZTRO</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {dashboard ? dashboard.ztroBalance.toLocaleString() : "0"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <span className="text-xs text-muted-foreground">ZTRO 스테이킹</span>
          <p className="mt-1 font-display text-2xl font-semibold text-primary">
            {dashboard ? dashboard.staked.toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* 수탁지갑 주소 */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <span className="text-xs text-muted-foreground">Ztro 수탁지갑 주소 (Custodial Wallet)</span>
        {dashboard ? (
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs break-all text-foreground">{dashboard.address}</p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 text-xs bg-secondary border border-border hover:bg-secondary/80 font-medium rounded-md px-2.5 py-1 text-muted-foreground transition"
            >
              {addressCopied ? "복사됨!" : "주소 복사"}
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">불러오는 중...</p>
        )}
      </div>

      {/* Ticket 및 NFT 섹션 삭제됨 */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ZP 충전 신청 카드 */}
        <div className="lg:col-span-2 rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-display text-lg font-medium text-foreground">ZP 충전 신청 (VND/KRW/USD)</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              신청 금액만큼 아래 지정 계좌로 입금해 주시면 입금 확인 즉시 ZP가 승인 지급됩니다.
            </p>
          </div>

          {/* 실시간 환율 & 계좌 정보 */}
          <div className="bg-secondary/40 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-primary mb-2">실시간 기준 환율 (1 USD = 10,000 ZP)</h4>
              <ul className="space-y-1 text-muted-foreground mono">
                <li>🇻🇳 10,000 ZP = {usdRate.toLocaleString(undefined, { maximumFractionDigits: 1 })} VND</li>
                <li>🇰🇷 10,000 ZP = {krwRate.toLocaleString(undefined, { maximumFractionDigits: 1 })} KRW</li>
              </ul>
              {ratesLoading && <span className="text-[10px] text-muted-foreground/60">(환율 갱신 중...)</span>}
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">입금 안내 계좌 info</h4>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground block">🇻🇳 베트남 동 (VND) - Techcom Bank</span>
                  <span>19037852768012 / 예금주: SHIN HEON CHEOL</span>
                </div>
                <hr className="border-border/30" />
                <div>
                  <span className="font-medium text-foreground block">🇰🇷 한국 원화 (KRW) - 하나은행</span>
                  <span>381. 19. 03076. 2 / 예금주: 오용진</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">충전할 ZP 수량 (ZP) *</span>
                <input
                  type="number"
                  min={10000}
                  step={1000}
                  value={zpAmount}
                  onChange={(e) => setZpAmount(Number(e.target.value))}
                  placeholder="최소 10,000 ZP 이상"
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">입금자명 *</span>
                <input
                  type="text"
                  maxLength={20}
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="예: 홍길동 (입금 시 이름)"
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">입금 통화 선택 (Currency) *</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="currency"
                    checked={currency === "VND"}
                    onChange={() => setCurrency("VND")}
                    className="accent-primary"
                  />
                  🇻🇳 VND (베트남 계좌 입금)
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="currency"
                    checked={currency === "KRW"}
                    onChange={() => setCurrency("KRW")}
                    className="accent-primary"
                  />
                  🇰🇷 KRW (한국 계좌 입금)
                </label>
              </div>
            </div>

            {/* 실시간 계산 예상 금액 */}
            <div className="bg-secondary/20 border border-border/40 rounded-lg p-3 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">입금 예정 금액 (Estimated Deposit):</span>
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
              {isSubmitting ? "신청 처리 중..." : "충전 신청하기"}
            </button>
          </form>
        </div>

        {/* 입금 안내 / 제출 결과 */}
        <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-4">
          <h3 className="font-display text-sm font-semibold text-foreground border-b border-border/50 pb-2">최근 신청 결과 (Recent Request)</h3>
          {recentResult ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-md">
                충전 신청이 완료되었습니다! 아래 계좌 정보로 이체해주시면 확인 즉시 반영됩니다.
              </div>
              <div className="space-y-2 text-muted-foreground bg-secondary/20 p-3 rounded-md">
                <div className="flex justify-between"><span>참조코드</span><span className="font-mono text-foreground font-semibold selection:bg-primary selection:text-primary-foreground">{recentResult.refCode}</span></div>
                <div className="flex justify-between"><span>충전 ZP</span><span className="text-foreground">{recentResult.zpAmount.toLocaleString()} ZP</span></div>
                <div className="flex justify-between"><span>입금 금액</span><span className="font-semibold text-white">{recentResult.estimatedAmount.toLocaleString()} {recentResult.currency}</span></div>
                <div className="flex justify-between"><span>입금 은행</span><span className="text-foreground">{recentResult.currency === "VND" ? "TECHCOM BANK" : "하나은행"}</span></div>
                <div className="flex justify-between"><span>계좌번호</span><span className="text-foreground font-mono">{recentResult.currency === "VND" ? "19037852768012" : "381. 19. 03076. 2"}</span></div>
                <div className="flex justify-between"><span>예금주</span><span className="text-foreground">{recentResult.currency === "VND" ? "신헌철 (SHIN HEON CHEOL)" : "오용진"}</span></div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ※ 이체 시 <strong>입금자명 뒤에 참조코드를 기재</strong>하거나 계좌 예금주 정보를 참조코드와 매칭하면 더욱 빠른 충전이 가능합니다.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 border border-dashed border-border/40 rounded-lg text-xs text-muted-foreground">
              최근 신청한 내역 결과가 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* 충전 역사 테이블 */}
      <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-border/50">
          <h3 className="font-display text-sm font-semibold text-foreground">충전 신청 내역 (Top-up History)</h3>
          <button
            onClick={loadDepositHistory}
            className="text-xs bg-secondary border border-border hover:bg-secondary/80 font-medium rounded-md px-2.5 py-1 text-muted-foreground transition"
          >
            새로고침
          </button>
        </div>

        {depositRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="py-2.5 font-medium">신청일시</th>
                  <th className="py-2.5 font-medium">참조코드</th>
                  <th className="py-2.5 font-medium">입금자</th>
                  <th className="py-2.5 font-medium">ZP 수량</th>
                  <th className="py-2.5 font-medium">입금 금액</th>
                  <th className="py-2.5 font-medium">이체통화</th>
                  <th className="py-2.5 font-medium">상태</th>
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
                        : `${Math.round((req.zpAmount / 10000) * 1395.2).toLocaleString()} KRW`
                      }
                    </td>
                    <td className="py-2.5">{req.currency}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {req.status === 'approved' ? '승인완료 (Approved)' :
                          req.status === 'rejected' ? '반려됨 (Rejected)' :
                            '대기중 (Pending)'}
                      </span>
                      {req.rejectReason && (
                        <span className="block text-[10px] text-red-400 mt-0.5">사유: {req.rejectReason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">최근 충전 신청 내역이 존재하지 않습니다.</p>
        )}
      </div>
    </div>
  )
}
