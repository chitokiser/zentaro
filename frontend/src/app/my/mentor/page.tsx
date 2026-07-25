"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchMentorDashboard, type MentorDashboard } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function MentorPage() {
  const { t } = useI18n()
  const m = t.myPage.mentor
  const [data, setData] = useState<MentorDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMentorDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : m.genericError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error === "로그인이 필요합니다.") {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          {t.myPage.wallet.loginCta}
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">{m.loading}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-primary/30 bg-secondary/30 p-4 text-xs text-primary">
        {m.rewardRateNoticePrefix}
        <span className="notranslate">EXP</span>
        {m.rewardRateNoticeSuffix}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="font-display text-base font-medium">{m.referrerSectionTitle}</h3>
          {data.referrer ? (
            <div className="mt-2 flex flex-col gap-0.5 text-sm">
              <span className="font-medium">{data.referrer.displayName ?? data.referrer.email}</span>
              {data.referrer.displayName ? (
                <span className="text-xs text-muted-foreground">{data.referrer.email}</span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{m.noReferrer}</p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="font-display text-base font-medium">{m.earnedSectionTitle}</h3>
          <p className="mt-2 text-lg font-semibold text-primary">
            {data.totalEarnedExp.toLocaleString()} <span className="notranslate">EXP</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">{m.earnedExpSuffix}</span>
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="font-display text-base font-medium">{m.org}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{m.comingSoon}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">{m.referredSectionTitle}</h3>
        <div className="mt-4 flex flex-col gap-2">
          {data.referredMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground">{m.referredEmpty}</p>
          ) : (
            data.referredMembers.map((member) => (
              <div
                key={member.uid}
                className="flex flex-col gap-0.5 rounded-md border border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.displayName ?? member.email}</span>
                  {member.displayName ? (
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.createdAt ? `${m.joinedAtPrefix}${new Date(member.createdAt._seconds * 1000).toLocaleDateString()}` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mentees' Purchases Ledger */}
      <div className="rounded-lg border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="font-display text-base font-medium">멘티 구매 및 리워드 장부 (Ledger)</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            실시간 적립 장부
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {!data.referredPurchases || data.referredPurchases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">아직 기록된 멘티의 구매 내역이 없습니다.</p>
          ) : (
            data.referredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-col gap-2 rounded-md border border-border/40 bg-background/30 p-4 sm:flex-row sm:items-center sm:justify-between hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      구매 회원:
                    </span>
                    <span className="text-sm font-medium">{purchase.referredUserEmail ?? "알 수 없음"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${purchase.rewardLevel === 2
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                      {purchase.rewardLevel === 2 ? "총판 리워드 (2단계)" : "대리점 리워드 (1단계)"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{purchase.description}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 min-w-[120px]">
                  <span className="text-sm font-semibold text-emerald-500">
                    +{purchase.amount.toLocaleString()} EXP
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {purchase.createdAt
                      ? new Date(purchase.createdAt._seconds * 1000).toLocaleString()
                      : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
