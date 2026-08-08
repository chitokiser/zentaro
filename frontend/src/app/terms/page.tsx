"use client"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function TermsPage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader eyebrow={t.terms.eyebrow} title={t.terms.title} description={t.terms.description} />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="mb-8 text-xs text-muted-foreground">{t.terms.updated}</p>
        <div className="space-y-8">
          {t.terms.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="mb-2 font-semibold text-foreground">{section.heading}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
