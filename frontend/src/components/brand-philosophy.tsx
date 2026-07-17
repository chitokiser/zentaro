const ZEN_VALUES = [
  { en: "Balance", ko: "균형" },
  { en: "Craftsmanship", ko: "장인정신" },
  { en: "Restraint", ko: "절제" },
  { en: "Inner Peace", ko: "내면의 평온" },
]

const TARO_LETTERS = [
  { letter: "T", en: "Taste", ko: "깊고 균형 잡힌 맛" },
  { letter: "A", en: "Aroma", ko: "오래 기억되는 향" },
  { letter: "R", en: "Refined", ko: "세련되고 품격 있는 완성도" },
  { letter: "O", en: "Origin", ko: "원료와 전통, 그리고 진정성" },
]

const MANIFESTO_LINES = [
  "Every great whisky begins with patience.",
  "Every memorable aroma begins with purity.",
  "Every refined taste begins with craftsmanship.",
  "Every authentic story begins with its origin.",
]

const SLOGAN_CANDIDATES = [
  "Crafted in Balance",
  "The Art of Refined Whisky",
  "Taste the Balance",
  "Where Craft Meets Serenity",
  "Born from Origin. Perfected by Time.",
  "Balanced by Zen. Refined by Time.",
]

export function BrandPhilosophy() {
  return (
    <div className="flex flex-col gap-14">
      {/* Brand Statement */}
      <div className="text-center">
        <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">
          Balance in Craft.
          <br />
          Elegance in Every Sip.
        </p>
      </div>

      {/* ZEN */}
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-3xl font-semibold text-primary">ZEN</h3>
          <span className="text-sm text-muted-foreground">
            Simplicity. Balance. Mastery.
          </span>
        </div>
        <p className="mt-3 max-w-2xl">
          Zen은 단순한 명상이 아니라 삶의 태도입니다. 우리는 좋은 위스키는
          천천히 완성된다고 믿습니다. 조급함보다 기다림을, 화려함보다 본질을
          선택합니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ZEN_VALUES.map((value) => (
            <div
              key={value.en}
              className="rounded-lg border border-border/60 bg-card px-4 py-4 text-center"
            >
              <p className="font-display text-sm font-medium text-foreground">
                {value.en}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{value.ko}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TARO */}
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-3xl font-semibold text-primary">TARO</h3>
          <span className="text-sm text-muted-foreground">
            Taste · Aroma · Refined · Origin
          </span>
        </div>
        <p className="mt-3 max-w-2xl">
          Taro는 ZenTaro가 추구하는 위스키의 네 가지 가치입니다.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TARO_LETTERS.map((item) => (
            <div
              key={item.letter}
              className="rounded-lg border border-border/60 bg-card p-5"
            >
              <span className="font-display text-3xl font-semibold text-primary">
                {item.letter}
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">{item.en}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.ko}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Philosophy */}
      <div className="rounded-xl border border-primary/20 bg-secondary/30 p-6 sm:p-8">
        <p className="font-display text-lg font-medium text-foreground sm:text-xl">
          Zen creates the mindset.
          <br />
          Taro defines the experience.
        </p>
        <p className="mt-4">
          Zen은 만드는 사람의 철학이며, Taro는 마시는 사람이 경험하는
          가치입니다. 우리는 단순히 위스키를 만드는 것이 아니라, 시간과
          장인정신, 그리고 품격을 한 병에 담습니다.
        </p>
      </div>

      {/* Manifesto */}
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Brand Manifesto
        </h3>
        <div className="mx-auto mt-5 flex max-w-xl flex-col gap-2">
          {MANIFESTO_LINES.map((line) => (
            <p key={line} className="text-sm text-muted-foreground sm:text-base">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-5 font-display text-lg font-semibold text-primary">
          This is ZenTaro.
        </p>
      </div>

      {/* Slogan candidates */}
      <div>
        <h3 className="text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          슬로건 후보
        </h3>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SLOGAN_CANDIDATES.map((slogan) => (
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
