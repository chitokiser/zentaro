"use client"

import { useI18n } from "@/lib/i18n/i18n-context"

export function BrandStory() {
  const { t } = useI18n()
  const pillars = Object.values(t.home.brandStory.pillars)

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          {t.home.brandStory.eyebrow}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          {t.home.brandStory.title}
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="flex flex-col gap-2 bg-card p-8 transition-colors hover:bg-secondary/60"
          >
            <h3 className="font-display text-2xl font-semibold">
              {pillar.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
