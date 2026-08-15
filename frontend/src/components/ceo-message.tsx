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

      {m.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {m.sections.map((section) => (
        <div key={section.heading} className="flex flex-col gap-4 pt-2">
          <h3 className="font-display text-base font-semibold uppercase tracking-wider text-primary">
            {section.heading}
          </h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-4 pt-2">
        <p>{m.promise.intro}</p>
        <p className="border-l-2 border-primary/40 pl-5 italic text-muted-foreground">
          {m.promise.poem.map((line, idx) => (
            <span key={line}>
              {line}
              {idx < m.promise.poem.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
        <div>
          <p>{m.promise.leadIn}</p>
          <ul className="my-3 flex flex-wrap gap-2">
            {m.promise.principles.map((principle) => (
              <li
                key={principle}
                className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-sm text-foreground"
              >
                {principle}
              </li>
            ))}
          </ul>
          <p>{m.promise.afterPrinciples}</p>
        </div>
        <p>{m.promise.vietnamToWorld}</p>
        <p className="italic text-muted-foreground">
          {m.promise.closingPoem.map((line, idx) => (
            <span key={line}>
              {line}
              {idx < m.promise.closingPoem.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>

      <p>{m.finalThanks}</p>

      <div className="mt-2 text-right">
        <p className="font-display text-base font-medium text-primary">{m.signature.company}</p>
        <p className="font-display text-sm font-medium text-primary/80">{m.signature.brand}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.signature.title} {m.signature.name}
        </p>
      </div>
    </div>
  )
}
