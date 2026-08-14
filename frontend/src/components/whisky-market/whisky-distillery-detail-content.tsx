"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PriceTrendChart } from "@/components/whisky-market/price-trend-chart"
import {
  fetchWhiskyDistillery,
  fetchWhiskyWatchlist,
  addWhiskyWatch,
  removeWhiskyWatch,
  fetchWhiskyTargets,
  setWhiskyTarget,
  removeWhiskyTarget,
  getToken,
  type WhiskyDistilleryDetail,
  type WhiskyTarget,
} from "@/lib/auth-client"

const STATUS_LABEL: Record<WhiskyTarget["status"], string> = {
  WITHIN_TARGET: "WITHIN TARGET",
  OVER_TARGET: "OVER TARGET",
  NO_DATA: "NO DATA",
}

export function WhiskyDistilleryDetailContent({ slug }: { slug: string }) {
  const [distillery, setDistillery] = useState<WhiskyDistilleryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWatched, setIsWatched] = useState(false)
  const [target, setTarget] = useState<WhiskyTarget | null>(null)
  const [targetInput, setTargetInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchWhiskyDistillery(slug)
      .then(setDistillery)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [slug])

  useEffect(() => {
    if (!getToken()) return
    fetchWhiskyWatchlist()
      .then((list) => setIsWatched(list.some((w) => w.distillerySlug === slug)))
      .catch(() => undefined)
    fetchWhiskyTargets()
      .then((list) => setTarget(list.find((t) => t.distillerySlug === slug) ?? null))
      .catch(() => undefined)
  }, [slug])

  const history = distillery?.history
  const meanTrend = useMemo(() => history?.slice().reverse().map((h) => ({ dt: h.dt, value: h.winning_bid_mean })) ?? [], [history])
  const volumeTrend = useMemo(() => history?.slice().reverse().map((h) => ({ dt: h.dt, value: h.trading_volume })) ?? [], [history])
  const latest = history && history.length > 0 ? history[0] : null

  async function handleToggleWatch() {
    if (!getToken()) {
      setMessage("로그인 후 관심 등록할 수 있습니다.")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      if (isWatched) {
        await removeWhiskyWatch(slug)
        setIsWatched(false)
      } else {
        await addWhiskyWatch(slug)
        setIsWatched(true)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "처리에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSetTarget() {
    if (!getToken()) {
      setMessage("로그인 후 목표가격을 설정할 수 있습니다.")
      return
    }
    const price = Number(targetInput)
    if (!Number.isFinite(price) || price <= 0) {
      setMessage("올바른 목표가격을 입력하세요.")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await setWhiskyTarget(slug, price)
      const list = await fetchWhiskyTargets()
      setTarget(list.find((t) => t.distillerySlug === slug) ?? null)
      setTargetInput("")
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveTarget() {
    setBusy(true)
    setMessage(null)
    try {
      await removeWhiskyTarget(slug)
      setTarget(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!distillery) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/drinks/whisky" className="mb-6 inline-block text-xs text-primary underline underline-offset-4">
        ← Whisky Market
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{distillery.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{distillery.country}</p>
        </div>
        <Button variant={isWatched ? "default" : "outline"} size="sm" disabled={busy} onClick={handleToggleWatch}>
          {isWatched ? "♥ Watching" : "♡ Watch"}
        </Button>
      </div>

      {latest ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recent Mean</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">£{latest.winning_bid_mean.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recent Low</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">£{latest.winning_bid_min.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recent High</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">£{latest.winning_bid_max.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lots Sold</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">{latest.lots_count.toLocaleString()}</p>
          </div>
          <p className="col-span-2 text-[10px] text-muted-foreground sm:col-span-4">
            For {new Date(latest.dt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })} — monthly aggregate, not a
            live auction price.
          </p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">이 증류소에 대한 시장 데이터가 없습니다.</p>
      )}

      {meanTrend.length > 0 ? (
        <section className="mt-10 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Price Trend</h2>
          <p className="mb-4 text-xs text-muted-foreground">Mean winning bid per month (£).</p>
          <PriceTrendChart points={meanTrend} valueLabel="Mean winning bid" valuePrefix="£" />
        </section>
      ) : null}

      {volumeTrend.length > 0 ? (
        <section className="mt-6 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Trading Volume</h2>
          <p className="mb-4 text-xs text-muted-foreground">Total value of lots sold per month (£).</p>
          <PriceTrendChart points={volumeTrend} valueLabel="Trading volume" valuePrefix="£" />
        </section>
      ) : null}

      <section className="mt-10 rounded-xl border border-primary/40 bg-secondary/30 p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">My Target Price</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Compared against the most recent monthly average winning bid — not a live current bid. Market data insight
          only, not a guarantee of value.
        </p>

        {target ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">My Target</p>
              <p className="font-display text-lg font-semibold text-foreground">£{target.targetPrice.toLocaleString()}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                target.status === "WITHIN_TARGET"
                  ? "border-emerald-500/40 text-emerald-500"
                  : target.status === "OVER_TARGET"
                    ? "border-destructive/40 text-destructive"
                    : "border-border text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[target.status]}
            </span>
            <Button size="sm" variant="outline" disabled={busy} onClick={handleRemoveTarget}>
              목표 삭제
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="£"
              className="w-32 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            />
            <Button size="sm" disabled={busy} onClick={handleSetTarget}>
              목표가격 설정
            </Button>
          </div>
        )}
        {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
      </section>

      <p className="mt-10 text-[10px] text-muted-foreground">Market data source: Whisky Hunter (whiskyhunter.net)</p>
    </div>
  )
}
