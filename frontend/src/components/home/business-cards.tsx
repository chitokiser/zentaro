import Link from "next/link"

const BUSINESS_UNITS = [
  { name: "Distillery", href: "/about/distillery" },
  { name: "Research Lab", href: "/about/research-lab" },
  { name: "Dry Gin", href: "/about/business#dry-gin" },
  { name: "Whisky", href: "/about/business#whisky" },
  { name: "Liqueur", href: "/about/business#liqueur" },
  { name: "Functional Drink", href: "/about/business#functional-beverage" },
  { name: "Herb Deli", href: "/about/business#herb-deli" },
  { name: "Experience Center", href: "/about/business#experience-center" },
]

export function BusinessCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          Business
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          ZENTARO의 사업 영역
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BUSINESS_UNITS.map((unit) => (
          <Link
            key={unit.name}
            href={unit.href}
            className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-center transition-all hover:border-primary/60 hover:bg-secondary"
          >
            <span className="font-display text-lg font-medium text-foreground transition-colors group-hover:text-primary">
              {unit.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
