"use client"

import { useEffect, useRef, useState } from "react"
import { fetchInvestorWatchAlertCount } from "@/lib/auth-client"

export function InvestorWatchNavBadge() {
  const [count, setCount] = useState(0)
  const prevCount = useRef<number | null>(null)

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    function poll() {
      fetchInvestorWatchAlertCount()
        .then((res) => {
          // Only alert on a rising count — avoids firing on first load or when it drops
          // (admin acknowledging an alert shouldn't trigger a notification).
          if (
            prevCount.current !== null &&
            res.count > prevCount.current &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("ZENTARO 투자자 지갑 알림", {
              body: `임계치를 넘은 감시 대상이 ${res.count}건 있습니다.`,
            })
          }
          prevCount.current = res.count
          setCount(res.count)
        })
        .catch(() => undefined)
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  )
}
