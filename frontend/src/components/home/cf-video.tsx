import Image from "next/image"

export function CfVideo() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-primary/20 bg-secondary shadow-2xl">
          {/* ZenTaro Bar key visual stands in until the brand CF video is delivered. */}
          <Image
            src="/images/hero/0.png"
            alt="ZenTaro Bar — Timeless Grain, Refined Moment"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
