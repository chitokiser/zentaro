"use client"

import { useI18n } from "@/lib/i18n/i18n-context"

export default function MentorPage() {
  const { t } = useI18n()
  const labels = [t.myPage.mentor.referrer, t.myPage.mentor.referred, t.myPage.mentor.org]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {labels.map((label) => (
        <div key={label} className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="font-display text-base font-medium">{label}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{t.myPage.mentor.comingSoon}</p>
        </div>
      ))}
    </div>
  )
}
