const PILLARS = [
  {
    title: "증류",
    en: "Distillation",
    description: "구리 단식 증류기로 한 방울씩 뽑아내는 정제된 스피릿.",
  },
  {
    title: "허브",
    en: "Botanical",
    description: "주니퍼베리, 로터스, 핑크페퍼 등 엄선한 보태니컬.",
  },
  {
    title: "숙성",
    en: "Aging",
    description: "배럴룸에서 시간이 빚어내는 깊은 풍미의 변화.",
  },
  {
    title: "사람",
    en: "People",
    description: "증류사의 손끝에서 완성되는 크래프트 정신.",
  },
]

export function BrandStory() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          ZenTaro Story
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          네 가지 여정이 만나는 지점
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="flex flex-col gap-2 bg-card p-8 transition-colors hover:bg-secondary/60"
          >
            <span className="text-xs uppercase tracking-widest text-primary/80">
              {pillar.en}
            </span>
            <h3 className="font-display text-2xl font-semibold">
              {pillar.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
