"use client"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function ContactPage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader eyebrow={t.contact.eyebrow} title={t.contact.title} description={t.contact.description} />
      <div className="mx-auto max-w-2xl px-4 py-14 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>{t.contact.body}</p>
        <dl className="mt-6 space-y-3 rounded-lg border border-border/60 p-5">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium text-foreground">{t.contact.phoneLabel}</dt>
            <dd>
              <a href={`tel:${t.contact.phone}`} className="hover:text-foreground hover:underline">
                {t.contact.phone}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium text-foreground">{t.contact.emailLabel}</dt>
            <dd>
              <a href={`mailto:${t.contact.email}`} className="hover:text-foreground hover:underline">
                {t.contact.email}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-medium text-foreground">{t.contact.addressLabel}</dt>
            <dd>{t.contact.address}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
