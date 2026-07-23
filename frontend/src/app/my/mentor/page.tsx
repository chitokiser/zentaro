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
    </div>
  )
}
