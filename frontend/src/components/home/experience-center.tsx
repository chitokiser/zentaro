"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"

export function ExperienceCenter() {
  const { t } = useI18n()
  const programs = Object.values(t.home.experienceCenter.programs)

  return (
    <section className="border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          {t.home.experienceCenter.eyebrow}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          {t.home.experienceCenter.title}
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {programs.map((program) => (
            <span
              key={program}
              className="rounded-full border border-primary/30 bg-background px-5 py-2 text-sm text-foreground"
            >
              {program}
            </span>
          ))}
        </div>

        <Button className="mt-10 bg-primary px-8 text-primary-foreground hover:bg-primary/90">
          {t.home.experienceCenter.reserveCta}
        </Button>
      </div>
    </section>
  )
}
