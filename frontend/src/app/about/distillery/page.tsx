"use client"

import { PageHeader, Section } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function DistilleryPage() {
  const { t } = useI18n()
  const d = t.about.distillery

  return (
    <div>
      <PageHeader eyebrow={d.eyebrow} title={d.title} description={d.description} />
      <Section id="intro" title={d.introTitle}>
        <p>{d.introBody}</p>
      </Section>
      <Section id="process" title={d.processTitle} className="border-t border-border/60">
        <p>{d.processBody}</p>
      </Section>
      <Section id="barrel-room" title={d.barrelRoomTitle} className="border-t border-border/60">
        <p>{d.barrelRoomBody}</p>
      </Section>
      <Section id="equipment" title={d.equipmentTitle} className="border-t border-border/60">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">{d.equipmentColEquipment}</th>
                <th className="px-4 py-2 font-medium">{d.equipmentColUse}</th>
              </tr>
            </thead>
            <tbody>
              {d.equipment.map((eq) => (
                <tr key={eq.name} className="border-t border-border/60">
                  <td className="px-4 py-2">{eq.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{eq.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
