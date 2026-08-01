"use client"

import Image from "next/image"
import { useZtaroPricingInfo } from "@/lib/use-ztaro-discount"

export function ZtaroBenefitBanner({ className = "" }: { className?: string }) {
  const { discountPercent, minStakeZtaro, minLevel } = useZtaroPricingInfo()

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary ${className}`}
    >
      <Image
        src="/images/brand/ZtaroToken.png"
        alt="ZTARO"
        width={22}
        height={22}
        className="mt-0.5 shrink-0 rounded-full"
      />
      <div>
        <span className="notranslate font-semibold">ZTARO</span> 토큰으로 결제하면 전 상품{" "}
        <span className="font-semibold">{discountPercent}%</span> 할인이 적용돼요. (
        <span className="notranslate">EXP</span> 병행 사용은 불가)
        <span className="mt-1 block text-xs text-primary/70">
          (조건: {minStakeZtaro.toLocaleString()} <span className="notranslate">ZTARO</span> 이상 스테이킹 +
          레벨 {minLevel} 이상 회원)
        </span>
      </div>
    </div>
  )
}
