"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchTransactionsAdmin, type LedgerTransaction } from "@/lib/auth-client"

const TYPE_LABEL: Record<string, string> = {
  points_charge: "ZP 충전 승인",
  admin_exp_adjustment: "관리자 EXP 조정",
  staking_exp_reward: "스테이킹 주간 EXP",
  barrel_order: "배럴 주문 (EXP 차감)",
  barrel_delivery_fee: "배럴 직접배송 택배비",
  barrel_resale: "배럴 오너 간 매매",
  barrel_resale_fee: "배럴 P2P 거래 수수료 (3%)",
  zp_to_exp_conversion: "ZP → EXP 전환 (1:1)",
  zentaro_mall_purchase: "몰 구매 (ZP/EXP 결제)",
  zentaro_bottle_cap_reward: "병뚜껑 리워드",
  zentaro_contribution_reward: "현물출자 리워드",
}

const REFRESH_INTERVAL_MS = 10000

function formatDate(item: LedgerTransaction) {
  const seconds = item.createdAt?._seconds
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString("ko-KR")
}

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<LedgerTransaction[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(() => {
    fetchTransactionsAdmin()
      .then((data) => {
        setItems(data)
        setLastUpdated(new Date())
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "조회에 실패했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [autoRefresh, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items ?? []).filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false
      if (!q) return true
      return (item.email ?? "").toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    })
  }, [items, search, typeFilter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">EXP / ZP 발행 현황 모니터링</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          현금성 재화(EXP, ZP)가 발생한 모든 내역을 시간순으로 보여줍니다. 언제, 누구에게, 어떤 사유로
          지급/차감되었는지 추적할 수 있습니다. {REFRESH_INTERVAL_MS / 1000}초마다 자동 갱신됩니다.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-5 py-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-xs text-muted-foreground">
            {lastUpdated ? `마지막 갱신: ${lastUpdated.toLocaleTimeString("ko-KR")}` : "불러오는 중..."}
          </span>
          <Button size="sm" variant="outline" onClick={load}>
            새로고침
          </Button>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 갱신
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="이메일/사유 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border/60 bg-background px-2 py-2 text-xs text-foreground"
          >
            <option value="">전체 종류</option>
            {Object.entries(TYPE_LABEL).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">내역 ({filtered.length}건)</h3>
        {items === null ? (
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground">해당하는 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">시간</th>
                  <th className="py-2 pr-3 font-medium">회원</th>
                  <th className="py-2 pr-3 font-medium">종류</th>
                  <th className="py-2 pr-3 font-medium">수량</th>
                  <th className="py-2 font-medium">사유/설명</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 font-mono whitespace-nowrap">{formatDate(item)}</td>
                    <td className="py-2 pr-3">{item.email ?? "-"}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {TYPE_LABEL[item.type] ?? item.type}
                      </Badge>
                    </td>
                    <td
                      className={`py-2 pr-3 font-semibold whitespace-nowrap ${
                        item.amount >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {item.amount >= 0 ? "+" : ""}
                      {item.amount.toLocaleString()}
                    </td>
                    <td className="py-2 text-muted-foreground">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
