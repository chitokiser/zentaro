"use client"

import { useI18n } from "@/lib/i18n/i18n-context"

export function ShoppingMallCopy() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
        {t.home.mall.eyebrow}
      </span>
      <h2 className="font-display text-3xl font-semibold sm:text-4xl">
        {t.home.mall.title}
      </h2>
      <p className="max-w-lg text-sm text-muted-foreground">
        {t.home.mall.description}
      </p>
    </div>
  )
}
