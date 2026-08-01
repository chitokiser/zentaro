"use client"

import { PageHeader, Section } from "@/components/page-header"
import { BrandPhilosophy } from "@/components/brand-philosophy"
import { CeoMessage } from "@/components/ceo-message"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function CompanyPage() {
  const { t } = useI18n()
  const c = t.company

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
      />
      <Section id="brand-story" title={c.sections.brandStory} className="max-w-5xl">
        <BrandPhilosophy />
      </Section>
      <Section id="ceo-message" title={c.sections.ceoMessage} className="border-t border-border/60">
        <CeoMessage />
      </Section>
      <Section id="vision-mission" title={c.sections.visionMission} className="border-t border-border/60">
        <p className="mb-4">{c.visionStatement}</p>
        <p className="mb-6 text-muted-foreground">{c.missionStatement}</p>
        <ul className="list-disc space-y-2 pl-5">
          {c.visionMissionList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
