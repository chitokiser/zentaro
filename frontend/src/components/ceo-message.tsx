"use client"

import { useI18n } from "@/lib/i18n/i18n-context"

export function CeoMessage() {
  const { t } = useI18n()
  const m = t.company.ceoMessage

  return (
    <div className="flex flex-col gap-6">
      <blockquote className="border-l-2 border-primary/60 pl-5 font-display text-lg italic text-foreground sm:text-xl">
        &ldquo;{m.quote}&rdquo;
      </blockquote>

      <p>{m.greeting1}</p>
      <p>{m.greeting2}</p>

      {m.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <p>
        {m.closing1}
        <br />
        {m.closing1b}
      </p>

      <p>{m.closing2}</p>

      <p>{m.closing3}</p>

      <div className="mt-2 text-right">
        <p>{m.thanks}</p>
        <p className="mt-3 font-display text-base font-medium text-primary">
          {m.signatureCompany}
        </p>
        <p className="text-sm text-muted-foreground">
          {m.signatureTitle} {m.signatureName}
        </p>
      </div>
    </div>
  )
}
