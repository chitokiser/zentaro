"use client"

import { useEffect, useState } from "react"
import { fetchZtaroPricingConfig } from "@/lib/auth-client"

export interface ZtaroDiscountInfo {
  /** Whole percent, e.g. 30. Defaults to 30 while loading. */
  discountPercent: number
  /** How many ZP one ZTARO is worth at today's fixed snapshot rate. 0 while loading. */
  zpPerZtaro: number
}

const DEFAULT_INFO: ZtaroDiscountInfo = { discountPercent: 30, zpPerZtaro: 0 }

export function useZtaroPricingInfo(): ZtaroDiscountInfo {
  const [info, setInfo] = useState<ZtaroDiscountInfo>(DEFAULT_INFO)

  useEffect(() => {
    fetchZtaroPricingConfig()
      .then((config) =>
        setInfo({ discountPercent: Math.round(config.discountRate * 100), zpPerZtaro: config.zpPerZtaro }),
      )
      .catch(() => undefined)
  }, [])

  return info
}

/** Current ZTARO checkout discount, as a whole percent (e.g. 30). Defaults to 30 while loading. */
export function useZtaroDiscountPercent(): number {
  return useZtaroPricingInfo().discountPercent
}
