"use client"

import { PageHeader, Section } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function BusinessPage() {
  const { t } = useI18n()
  const b = t.about.business

  return (
    <div>
      <PageHeader eyebrow={b.eyebrow} title={b.title} description={b.description} />
      <Section title={b.sectionTitle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {b.units.map((unit) => (
            <div
              key={unit.id}
              id={unit.id}
              className="scroll-mt-24 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-lg font-medium text-primary">
                {unit.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {unit.description}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
