"use client"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function PrivacyPage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader eyebrow={t.privacy.eyebrow} title={t.privacy.title} description={t.privacy.description} />
      <div className="mx-auto max-w-2xl px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>{t.privacy.body}</p>
      </div>
    </div>
  )
}
