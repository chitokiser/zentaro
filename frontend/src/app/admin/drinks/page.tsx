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
  setZentaroFlagAdmin,
  fetchBeer9Status,
  syncBeer9Once,
  fetchProducersSyncStatus,
  syncProducersOnce,
  fetchFoodPairingsSyncStatus,
  syncFoodPairingsOnce,
  type DrinkSyncLog,
  type DrinkProduct,
  type Beer9Status,
  type ProducersSyncStatus,
  type FoodPairingsSyncStatus,
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
  const [zentaroSlug, setZentaroSlug] = useState("")
  const [zentaroBusy, setZentaroBusy] = useState(false)
  const [zentaroMessage, setZentaroMessage] = useState<string | null>(null)
  const [beer9Status, setBeer9Status] = useState<Beer9Status | null>(null)
  const [beer9Busy, setBeer9Busy] = useState(false)
  const [beer9Message, setBeer9Message] = useState<string | null>(null)
  const [producersStatus, setProducersStatus] = useState<ProducersSyncStatus | null>(null)
  const [producersBusy, setProducersBusy] = useState(false)
  const [producersMessage, setProducersMessage] = useState<string | null>(null)
  const [foodPairingsStatus, setFoodPairingsStatus] = useState<FoodPairingsSyncStatus | null>(null)
  const [foodPairingsBusy, setFoodPairingsBusy] = useState(false)
  const [foodPairingsMessage, setFoodPairingsMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchDrinkSyncLogs().then(setLogs).catch(() => setLogs(null))
    fetchDrinkMergeCandidates().then(setCandidates).catch(() => setCandidates(null))
    fetchRankingConfig().then((res) => setMinReviews(res.minReviews)).catch(() => undefined)
    fetchBeer9Status().then(setBeer9Status).catch(() => setBeer9Status(null))
    fetchProducersSyncStatus().then(setProducersStatus).catch(() => setProducersStatus(null))
    fetchFoodPairingsSyncStatus().then(setFoodPairingsStatus).catch(() => setFoodPairingsStatus(null))
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

  async function handleSyncBeer9(force: boolean) {
    setBeer9Busy(true)
    setBeer9Message(null)
    try {
      const res = await syncBeer9Once(undefined, force)
      setBeer9Message(
        `${res.pagesFetched}페이지 수집, 신규 ${res.newRecords} / 갱신 ${res.updatedRecords}건. 중단 사유: ${res.stoppedReason}` +
          (res.errors.length > 0 ? ` (오류 ${res.errors.length}건)` : ""),
      )
      fetchBeer9Status().then(setBeer9Status).catch(() => undefined)
    } catch (err) {
      setBeer9Message(err instanceof Error ? err.message : "수집에 실패했습니다.")
    } finally {
      setBeer9Busy(false)
    }
  }

  async function handleSyncProducers(force: boolean) {
    setProducersBusy(true)
    setProducersMessage(null)
    try {
      const res = await syncProducersOnce(undefined, undefined, force)
      setProducersMessage(
        `신규 ${res.newRecords} / 갱신 ${res.updatedRecords}건. Open Brewery DB ${res.openBreweryDbPagesFetched}페이지(${res.openBreweryDbStoppedReason}) ` +
          `· Wikidata 양조장 ${res.wikidataBreweriesFetched}건 · 증류소 ${res.wikidataDistilleriesFetched}건` +
          (res.errors.length > 0 ? ` (오류 ${res.errors.length}건)` : ""),
      )
      fetchProducersSyncStatus().then(setProducersStatus).catch(() => undefined)
    } catch (err) {
      setProducersMessage(err instanceof Error ? err.message : "수집에 실패했습니다.")
    } finally {
      setProducersBusy(false)
    }
  }

  async function handleSyncFoodPairings(force: boolean) {
    setFoodPairingsBusy(true)
    setFoodPairingsMessage(null)
    try {
      const res = await syncFoodPairingsOnce(undefined, force)
      setFoodPairingsMessage(
        `신규 ${res.newRecords} / 갱신 ${res.updatedRecords}건.` +
          (res.errors.length > 0 ? ` (오류 ${res.errors.length}건)` : ""),
      )
      fetchFoodPairingsSyncStatus().then(setFoodPairingsStatus).catch(() => undefined)
    } catch (err) {
      setFoodPairingsMessage(err instanceof Error ? err.message : "수집에 실패했습니다.")
    } finally {
      setFoodPairingsBusy(false)
    }
  }

  async function handleSetZentaroFlag(isZentaroProduct: boolean) {
    if (!zentaroSlug.trim()) return
    setZentaroBusy(true)
    setZentaroMessage(null)
    try {
      await setZentaroFlagAdmin(zentaroSlug.trim(), isZentaroProduct)
      setZentaroMessage(
        isZentaroProduct
          ? `"${zentaroSlug.trim()}"을(를) ZENTARO ORIGINAL로 표시했습니다.`
          : `"${zentaroSlug.trim()}"의 ZENTARO ORIGINAL 표시를 해제했습니다.`,
      )
    } catch (err) {
      setZentaroMessage(err instanceof Error ? err.message : "처리에 실패했습니다.")
    } finally {
      setZentaroBusy(false)
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
        <h3 className="mb-3 text-sm font-medium">Beer9 (맥주 데이터) 1회성 수집</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          RapidAPI Beer9는 월 100요청 제한이라 매일 동기화하지 않고, 여기서 버튼을 눌러 딱 한 번만
          카탈로그를 가져옵니다. 이미 수집을 완료했다면 아래 버튼은 재수집(쿼터 추가 소모)만 가능합니다.
        </p>
        {beer9Status?.oneTimeSyncCompletedAt ? (
          <p className="mb-3 text-xs text-muted-foreground">
            마지막 수집: {formatTimestamp(beer9Status.lastSyncedAt)} · {beer9Status.lastRunPagesFetched ?? 0}페이지 ·{" "}
            {beer9Status.lastRunProductsFetched ?? 0}개 상품 · 중단 사유: {beer9Status.lastRunStoppedReason ?? "-"}
          </p>
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">아직 수집한 적 없습니다.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!beer9Status?.oneTimeSyncCompletedAt ? (
            <Button size="sm" disabled={beer9Busy} onClick={() => handleSyncBeer9(false)}>
              {beer9Busy ? "수집 중..." : "지금 1회 수집"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={beer9Busy} onClick={() => handleSyncBeer9(true)}>
              {beer9Busy ? "수집 중..." : "쿼터 소모하고 재수집"}
            </Button>
          )}
        </div>
        {beer9Message ? <p className="mt-2 text-xs text-muted-foreground">{beer9Message}</p> : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">양조장/증류소 1회성 수집 (Open Brewery DB + Wikidata)</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          전세계 브루어리(Open Brewery DB)와 양조장/증류소(Wikidata SPARQL)를 한 번만 가져옵니다.
          데이터가 자주 바뀌지 않으므로 매일 동기화하지 않고, 여기서 버튼을 눌러 실행합니다.
        </p>
        {producersStatus?.oneTimeSyncCompletedAt ? (
          <p className="mb-3 text-xs text-muted-foreground">
            마지막 수집: {formatTimestamp(producersStatus.lastSyncedAt)} · 신규 {producersStatus.lastRunNewRecords ?? 0}건 ·{" "}
            갱신 {producersStatus.lastRunUpdatedRecords ?? 0}건
            {producersStatus.lastRunErrorCount ? ` · 오류 ${producersStatus.lastRunErrorCount}건` : ""}
          </p>
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">아직 수집한 적 없습니다.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!producersStatus?.oneTimeSyncCompletedAt ? (
            <Button size="sm" disabled={producersBusy} onClick={() => handleSyncProducers(false)}>
              {producersBusy ? "수집 중... (1분 이상 걸릴 수 있음)" : "지금 1회 수집"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={producersBusy} onClick={() => handleSyncProducers(true)}>
              {producersBusy ? "수집 중..." : "다시 수집 (force)"}
            </Button>
          )}
        </div>
        {producersMessage ? <p className="mt-2 text-xs text-muted-foreground">{producersMessage}</p> : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">ZENTARO 제품 음식 페어링 1회성 수집 (Tasty API)</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          ZENTARO 자체 제품(오크통 제외)에 어울리는 실제 Tasty 레시피를 한 번만 가져옵니다.
          Tasty는 향미(스모키/시트러스 등) 태그가 없어서, Happy Hour/베트남 요리처럼 실제로 존재하는
          상황·원산지 태그로만 매칭합니다.
        </p>
        {foodPairingsStatus?.oneTimeSyncCompletedAt ? (
          <p className="mb-3 text-xs text-muted-foreground">
            마지막 수집: {formatTimestamp(foodPairingsStatus.lastSyncedAt)} · 신규{" "}
            {foodPairingsStatus.lastRunNewRecords ?? 0}건 · 갱신 {foodPairingsStatus.lastRunUpdatedRecords ?? 0}건
            {foodPairingsStatus.lastRunErrorCount ? ` · 오류 ${foodPairingsStatus.lastRunErrorCount}건` : ""}
          </p>
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">아직 수집한 적 없습니다.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!foodPairingsStatus?.oneTimeSyncCompletedAt ? (
            <Button size="sm" disabled={foodPairingsBusy} onClick={() => handleSyncFoodPairings(false)}>
              {foodPairingsBusy ? "수집 중..." : "지금 1회 수집"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={foodPairingsBusy} onClick={() => handleSyncFoodPairings(true)}>
              {foodPairingsBusy ? "수집 중..." : "다시 수집 (force)"}
            </Button>
          )}
        </div>
        {foodPairingsMessage ? <p className="mt-2 text-xs text-muted-foreground">{foodPairingsMessage}</p> : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-medium">ZENTARO ORIGINAL 표시</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          상품의 slug(예: /drinks/hernos-gin 이면 hernos-gin)를 입력해 ZENTARO 자체 제품 여부를 표시하거나 해제합니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={zentaroSlug}
            onChange={(e) => setZentaroSlug(e.target.value)}
            placeholder="product-slug"
            className="w-56 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          />
          <Button size="sm" disabled={zentaroBusy || !zentaroSlug.trim()} onClick={() => handleSetZentaroFlag(true)}>
            ORIGINAL로 표시
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={zentaroBusy || !zentaroSlug.trim()}
            onClick={() => handleSetZentaroFlag(false)}
          >
            표시 해제
          </Button>
        </div>
        {zentaroMessage ? <p className="mt-2 text-xs text-muted-foreground">{zentaroMessage}</p> : null}
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
