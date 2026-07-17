import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="border-b border-border/60 bg-card/40 py-16">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function Section({
  id,
  title,
  children,
  className,
}: {
  id?: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto max-w-4xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8", className)}
    >
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  )
}
