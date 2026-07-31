"use client"

import { useEffect, useState } from "react"
import { fetchZtaroPricingConfig } from "@/lib/auth-client"

export interface ZtaroDiscountInfo {
  /** Whole percent, e.g. 30. Defaults to 30 while loading. */
  discountPercent: number
  /** How many ZP one ZTARO is worth at today's fixed snapshot rate. 0 while loading. */
  zpPerZtaro: number
  /** Minimum active vault-staked ZTARO required to pay with ZTARO. Defaults to 1,000,000 while loading. */
  minStakeZtaro: number
  /** Minimum member level (1-10) required to pay with ZTARO. Defaults to 2 while loading. */
  minLevel: number
}

const DEFAULT_INFO: ZtaroDiscountInfo = {
  discountPercent: 30,
  zpPerZtaro: 0,
  minStakeZtaro: 1_000_000,
  minLevel: 2,
}

export function useZtaroPricingInfo(): ZtaroDiscountInfo {
  const [info, setInfo] = useState<ZtaroDiscountInfo>(DEFAULT_INFO)

  useEffect(() => {
    fetchZtaroPricingConfig()
      .then((config) =>
        setInfo({
          discountPercent: Math.round(config.discountRate * 100),
          zpPerZtaro: config.zpPerZtaro,
          minStakeZtaro: config.minStakeZtaro,
          minLevel: config.minLevel,
        }),
      )
      .catch(() => undefined)
  }, [])

  return info
}

/** Current ZTARO checkout discount, as a whole percent (e.g. 30). Defaults to 30 while loading. */
export function useZtaroDiscountPercent(): number {
  return useZtaroPricingInfo().discountPercent
}
