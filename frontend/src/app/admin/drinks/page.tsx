"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  syncDrinksNow,
  fetchDrinkSyncLogs,
  fetchDrinkMergeCandidates,
  fetchRankingConfig,
  updateRankingConfig,
  recalcDrinkRankings,
  type DrinkSyncLog,
  type DrinkProduct,
} from "@/lib/auth-client"

function formatTimestamp(ts?: { _seconds: number } | null) {
  if (!ts?._seconds) return "-"
  return new Date(ts._seconds * 1000).toLocaleString("ko-KR")
}

export default function AdminDrinksPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [logs, setLogs] = useState<DrinkSyncLog[] | null>(null)
  const [candidates, setCandidates] = useState<DrinkProduct[] | null>(null)
  const [minReviews, setMinReviews] = useState<number>(10)
  const [rankingBusy, setRankingBusy] = useState(false)
  const [rankingMessage, setRankingMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchDrinkSyncLogs().then(setLogs).catch(() => setLogs(null))
    fetchDrinkMergeCandidates().then(setCandidates).catch(() => setCandidates(null))
    fetchRankingConfig().then((res) => setMinReviews(res.minReviews)).catch(() => undefined)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSync() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      await syncDrinksNow()
      setSyncMessage("동기화가 완료되었습니다.")
      load()
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "동기화에 실패했습니다.")
    } finally {
      setSyncing(false)
    }
  }

  async function handleSaveRankingConfig() {
    setRankingBusy(true)
    setRankingMessage(null)
    try {
      await updateRankingConfig(minReviews)
      setRankingMessage("최소 리뷰 수를 저장하고 랭킹을 재계산했습니다.")
    } catch (err) {
      setRankingMessage(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setRankingBusy(false)
    }
  }

  async function handleRecalc() {
    setRankingBusy(true)
    setRankingMessage(null)
    try {
      const res = await recalcDrinkRankings()
      setRankingMessage(`${res.updated}개 상품의 랭킹을 재계산했습니다.`)
    } catch (err) {
      setRankingMessage(err instanceof Error ? err.message : "재계산에 실패했습니다.")
    } finally {
      setRankingBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">Global Drinks 관리</h2>
      <p className="text-sm text-muted-foreground">
        WHISKY:EDITION(CC BY 4.0)과 TheCocktailDB(무료 API) 데이터를 매일 03:00 UTC 자동
        동기화합니다. 아래 버튼으로 즉시 실행할 수도 있습니다.
      </p>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">데이터 동기화</h3>
          <Button size="sm" disabled={syncing} onClick={handleSync}>
            {syncing ? "동기화 중..." : "지금 동기화"}
          </Button>
        </div>
        {syncMessage ? <p className="mt-2 text-xs text-muted-foreground">{syncMessage}</p> : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">최근 동기화 로그</h3>
        {logs === null ? (
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">동기화 기록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border border-border/40 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">{formatTimestamp(log.completedAt)}</span>
                  <Badge variant="outline" className="text-[10px]">신규 {log.newRecords}</Badge>
                  <Badge variant="outline" className="text-[10px]">갱신 {log.updatedRecords}</Badge>
                  {log.errors.length > 0 ? (
                    <Badge variant="destructive" className="text-[10px]">오류 {log.errors.length}</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">랭킹 설정 (Bayesian 최소 리뷰 수)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            value={minReviews}
            onChange={(e) => setMinReviews(Number(e.target.value))}
            className="w-24 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          />
          <Button size="sm" variant="outline" disabled={rankingBusy} onClick={handleSaveRankingConfig}>
            저장
          </Button>
          <Button size="sm" variant="outline" disabled={rankingBusy} onClick={handleRecalc}>
            랭킹 재계산만 실행
          </Button>
        </div>
        {rankingMessage ? <p className="mt-2 text-xs text-muted-foreground">{rankingMessage}</p> : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">중복 후보 (관리자 확인 필요)</h3>
        {candidates === null ? (
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        ) : candidates.length === 0 ? (
          <p className="text-xs text-muted-foreground">중복 후보가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((c) => (
              <div key={c.id} className="rounded-md border border-border/40 px-3 py-2 text-xs">
                <span className="font-medium">{c.name}</span> → {c.mergeCandidateOf}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
