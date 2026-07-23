"use client"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function TermsPage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader eyebrow={t.terms.eyebrow} title={t.terms.title} description={t.terms.description} />
      <div className="mx-auto max-w-2xl px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>{t.terms.body}</p>
      </div>
    </div>
  )
}
