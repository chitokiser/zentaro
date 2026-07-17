import { Button } from "@/components/ui/button"

const PROGRAMS = ["증류 체험", "Gin 만들기", "BBQ", "허브 정원", "시음회"]

export function ExperienceCenter() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          Experience Center
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          체험 프로그램
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {PROGRAMS.map((program) => (
            <span
              key={program}
              className="rounded-full border border-primary/30 bg-background px-5 py-2 text-sm text-foreground"
            >
              {program}
            </span>
          ))}
        </div>

        <Button className="mt-10 bg-primary px-8 text-primary-foreground hover:bg-primary/90">
          예약하기
        </Button>
      </div>
    </section>
  )
}
