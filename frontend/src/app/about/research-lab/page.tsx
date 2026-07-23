"use client"

import { PageHeader, Section } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

const BOTANICALS = [
  "Juniper Berry", "Coriander Seed", "Angelica Root", "Orris Root",
  "Licorice Root", "Cardamom", "Saigon Cinnamon", "Star Anise",
  "Black Pepper", "Pink Pepper", "Lemongrass", "Lotus Flower",
  "Jasmine Flower", "Rose Petals", "Hibiscus", "Freeze Dried Yuzu Peel",
]

export default function ResearchLabPage() {
  const { t } = useI18n()
  const r = t.about.researchLab

  return (
    <div>
      <PageHeader eyebrow={r.eyebrow} title={r.title} description={r.description} />
      <Section id="intro" title={r.introTitle}>
        <p>{r.introBody}</p>
      </Section>
      <Section id="projects" title={r.projectsTitle} className="border-t border-border/60">
        <div className="flex flex-wrap gap-2">
          {r.projects.map((p) => (
            <span
              key={p}
              className="rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs"
            >
              {p}
            </span>
          ))}
        </div>
      </Section>
      <Section id="botanical-library" title={r.botanicalLibraryTitle} className="border-t border-border/60">
        <p className="mb-4">{r.botanicalLibraryIntro}</p>
        <div className="flex flex-wrap gap-2">
          {BOTANICALS.map((b) => (
            <span
              key={b}
              className="rounded-full bg-secondary px-4 py-1.5 text-xs text-foreground"
            >
              {b}
            </span>
          ))}
        </div>
      </Section>
      <Section id="lab" title={r.labTitle} className="border-t border-border/60">
        <p>{r.labBody}</p>
      </Section>
    </div>
  )
}
