"use client"

import { useZtaroDiscountPercent } from "@/lib/use-ztaro-discount"

export function ZtaroBenefitBanner({ className = "" }: { className?: string }) {
  const discountPercent = useZtaroDiscountPercent()

  return (
    <div
      className={`rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary ${className}`}
    >
      <span className="notranslate font-semibold">ZTARO</span> 토큰으로 결제하면 전 상품 최대{" "}
      <span className="font-semibold">{discountPercent}%</span> 할인, <span className="notranslate">EXP</span>도
      함께 적용해 추가로 할인받을 수 있어요.
    </div>
  )
}
