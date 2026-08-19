"use client"

import { PageHeader, Section } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"
import BotanicalArchive from "@/components/research-lab/botanical-archive"

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
      <div id="botanical-library" className="scroll-mt-24 border-t border-border/60">
        <BotanicalArchive />
      </div>
      <Section id="lab" title={r.labTitle} className="border-t border-border/60">
        <p>{r.labBody}</p>
      </Section>
    </div>
  )
}
