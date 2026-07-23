"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"

export function BarrelReservePromo() {
  const { t } = useI18n()
  const { eyebrow, title, description, highlights, cta } = t.home.barrelReserve

  return (
    <section className="relative overflow-hidden border-y border-border/60 py-24">
      <Image
        src="/images/rewards/barrel-cellar-2.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          {eyebrow}
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-primary/30 bg-background/80 px-5 py-2 text-sm text-foreground"
            >
              {highlight}
            </span>
          ))}
        </div>

        <Button
          asChild
          size="lg"
          className="mt-10 bg-primary px-8 text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/rewards/barrel-reserve">{cta}</Link>
        </Button>
      </div>
    </section>
  )
}
