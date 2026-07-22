import { ArrowDown } from "lucide-react"

const FLOW = [
  "Bottle Cap",
  "QR",
  "Lottery",
  "ZTRO Token",
  "Staking",
  "Weekly Reward",
  "Premium Products",
]

export function RewardEcosystem() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          Reward Ecosystem
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          한눈에 보는 리워드 구조
        </h2>
      </div>

      <div className="mt-14 flex flex-col items-center gap-2">
        {FLOW.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <div className="w-full min-w-[220px] rounded-full border border-primary/40 bg-card px-6 py-3 text-center">
              <span className="font-display text-sm font-medium text-foreground sm:text-base">
                {step}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <ArrowDown className="size-5 text-primary/60" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
