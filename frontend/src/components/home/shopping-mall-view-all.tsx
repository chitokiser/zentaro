"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/i18n-context"

export function ShoppingMallViewAll() {
  const { t } = useI18n()

  return (
    <div className="mt-10 text-center">
      <Link href="/mall" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        {t.home.mall.viewAll}
      </Link>
    </div>
  )
}
