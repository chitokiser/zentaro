import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-background">
      {/* Placeholder for the full-bleed brand video; swap the gradient below for a <video> element once footage is ready. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.15]"
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
        <h1 className="font-display text-5xl font-semibold leading-tight text-foreground sm:text-6xl md:text-7xl">
          Every Bottle
          <br />
          Tells a Story
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          진(Gin), 위스키, 리큐르 — 보태니컬을 증류하는 ZENTARO의 여정을
          만나보세요.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-primary px-8 text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/about/distillery">Explore</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary/50 px-8 text-foreground hover:bg-secondary hover:text-primary"
          >
            <Link href="/mall">Shop Now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
