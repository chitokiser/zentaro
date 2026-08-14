"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  fetchWhiskyWatchlist,
  removeWhiskyWatch,
  fetchWhiskyTargets,
  removeWhiskyTarget,
  getToken,
  type WhiskyWatchItem,
  type WhiskyTarget,
} from "@/lib/auth-client"

const STATUS_LABEL: Record<WhiskyTarget["status"], string> = {
  WITHIN_TARGET: "WITHIN TARGET",
  OVER_TARGET: "OVER TARGET",
  NO_DATA: "NO DATA",
}

export function MyWhiskyContent() {
  const [loggedIn] = useState(() => !!getToken())
  const [watchlist, setWatchlist] = useState<WhiskyWatchItem[] | null>(null)
  const [targets, setTargets] = useState<WhiskyTarget[] | null>(null)
  const [error, setError] = useState<string | null>(loggedIn ? null : "로그인 후 이용할 수 있습니다.")

  function load() {
    fetchWhiskyWatchlist().then(setWatchlist).catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
    fetchWhiskyTargets().then(setTargets).catch(() => setTargets([]))
  }

  useEffect(() => {
    if (loggedIn) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRemoveWatch(slug: string) {
    await removeWhiskyWatch(slug).catch(() => undefined)
    load()
  }

  async function handleRemoveTarget(slug: string) {
    await removeWhiskyTarget(slug).catch(() => undefined)
    load()
  }

  if (error) return <p className="text-sm text-muted-foreground">{error}</p>

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">My Watchlist</h2>
        <p className="mt-1 text-xs text-muted-foreground">관심 등록한 증류소 목록입니다.</p>
        {watchlist === null ? (
          <p className="mt-4 text-sm text-muted-foreground">불러오는 중...</p>
        ) : watchlist.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            아직 관심 등록한 증류소가 없습니다.{" "}
            <Link href="/drinks/whisky" className="text-primary underline underline-offset-4">
              위스키 마켓 둘러보기
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {watchlist.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 text-sm">
                <Link href={`/drinks/whisky/distillery/${w.distillerySlug}`} className="hover:text-primary">
                  <p className="font-medium text-foreground">♥ {w.distilleryName}</p>
                  <p className="text-xs text-muted-foreground">{w.country}</p>
                </Link>
                <Button size="sm" variant="outline" onClick={() => handleRemoveWatch(w.distillerySlug)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">My Targets</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          설정한 목표가격입니다. 최근 월간 평균 낙찰가와 비교됩니다 (실시간 입찰가 아님).
        </p>
        {targets === null ? (
          <p className="mt-4 text-sm text-muted-foreground">불러오는 중...</p>
        ) : targets.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">설정한 목표가격이 없습니다.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {targets.map((t) => (
              <div key={t.id} className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <Link href={`/drinks/whisky/distillery/${t.distillerySlug}`} className="font-medium text-foreground hover:text-primary">
                    {t.distilleryName}
                  </Link>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      t.status === "WITHIN_TARGET"
                        ? "border-emerald-500/40 text-emerald-500"
                        : t.status === "OVER_TARGET"
                          ? "border-destructive/40 text-destructive"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  My Target £{t.targetPrice.toLocaleString()} · Latest Avg{" "}
                  {t.latestAvgPrice != null ? `£${t.latestAvgPrice.toLocaleString()}` : "N/A"}
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => handleRemoveTarget(t.distillerySlug)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
