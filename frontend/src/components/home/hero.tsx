"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"

const SLIDES = [
  "/images/hero/5.png",
  "/images/hero/3.png",
  "/images/hero/6.png",
  "/images/hero/4.png",
]

export function Hero() {
  const [active, setActive] = useState(0)
  const { t } = useI18n()

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-background">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover object-[center_25%] transition-opacity duration-[2000ms] ease-in-out ${
            i === active ? "opacity-45" : "opacity-0"
          }`}
        />
      ))}

      {/* Dark green wash + vignette so the photography reads as premium, not a snapshot */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_var(--background)_95%)]" />
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0px, transparent 2px, rgba(201,162,75,0.4) 2px, transparent 3px)",
          backgroundSize: "6px 100%",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          Craft Distillery
        </span>
        <h1 className="font-display text-5xl font-semibold leading-tight text-foreground drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-6xl md:text-7xl">
          Every Bottle
          <br />
          Tells a Story
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] sm:text-lg">
          {t.home.hero.subtitle}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-primary px-8 text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/about/distillery">{t.home.hero.exploreCta}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary/50 px-8 text-foreground hover:bg-secondary hover:text-primary"
          >
            <Link href="/mall">{t.home.hero.shopCta}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
