"use client"

import { useI18n } from "@/lib/i18n/i18n-context"

export function BrandPhilosophy() {
  const { t } = useI18n()
  const bp = t.company.brandPhilosophy

  const zenValues = [
    { en: "Balance", label: bp.zen.values.balance },
    { en: "Craftsmanship", label: bp.zen.values.craftsmanship },
    { en: "Restraint", label: bp.zen.values.restraint },
    { en: "Inner Peace", label: bp.zen.values.innerPeace },
  ]

  const taroLetters = [
    { letter: "T", ...bp.taro.letters.taste },
    { letter: "A", ...bp.taro.letters.aroma },
    { letter: "R", ...bp.taro.letters.refined },
    { letter: "O", ...bp.taro.letters.origin },
  ]

  return (
    <div className="flex flex-col gap-14">
      {/* Brand Statement */}
      <div className="text-center">
        <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">
          {bp.statementLine1}
          <br />
          {bp.statementLine2}
        </p>
      </div>

      {/* ZEN */}
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-3xl font-semibold text-primary">{bp.zen.title}</h3>
          <span className="text-sm text-muted-foreground">{bp.zen.subtitle}</span>
        </div>
        <p className="mt-3 max-w-2xl">{bp.zen.description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {zenValues.map((value) => (
            <div
              key={value.en}
              className="rounded-lg border border-border/60 bg-card px-4 py-4 text-center"
            >
              <p className="font-display text-sm font-medium text-foreground">
                {value.en}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{value.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TARO */}
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-3xl font-semibold text-primary">{bp.taro.title}</h3>
          <span className="text-sm text-muted-foreground">{bp.taro.subtitle}</span>
        </div>
        <p className="mt-3 max-w-2xl">{bp.taro.description}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {taroLetters.map((item) => (
            <div
              key={item.letter}
              className="rounded-lg border border-border/60 bg-card p-5"
            >
              <span className="font-display text-3xl font-semibold text-primary">
                {item.letter}
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Philosophy */}
      <div className="rounded-xl border border-primary/20 bg-secondary/30 p-6 sm:p-8">
        <p className="font-display text-lg font-medium text-foreground sm:text-xl">
          {bp.philosophy.line1}
          <br />
          {bp.philosophy.line2}
        </p>
        <p className="mt-4">{bp.philosophy.body}</p>
      </div>

      {/* Manifesto */}
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {bp.manifestoTitle}
        </h3>
        <div className="mx-auto mt-5 flex max-w-xl flex-col gap-2">
          {bp.manifestoLines.map((line) => (
            <p key={line} className="text-sm text-muted-foreground sm:text-base">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-5 font-display text-lg font-semibold text-primary">
          {bp.manifestoClosing}
        </p>
      </div>

      {/* Slogans */}
      <div>
        <h3 className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {bp.sloganTitle}
        </h3>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {bp.slogans.map((slogan) => (
            <span
              key={slogan}
              className="rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs text-foreground"
            >
              {slogan}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
