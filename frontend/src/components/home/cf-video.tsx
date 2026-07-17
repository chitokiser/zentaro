export function CfVideo() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-primary/20 bg-secondary shadow-2xl">
          {/* Autoplaying brand CF video goes here once footage is delivered. */}
          <video
            className="h-full w-full object-cover opacity-80"
            autoPlay
            muted
            loop
            playsInline
            poster=""
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
            <p className="font-display text-lg tracking-widest text-primary">
              ZENTARO BRAND FILM
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
