"use client"

import { useEffect, useRef, useState } from "react"
import { fetchUnreadOrderCount } from "@/lib/auth-client"

export function OrdersNavBadge() {
  const [count, setCount] = useState(0)
  const prevCount = useRef<number | null>(null)

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    function poll() {
      fetchUnreadOrderCount()
        .then((res) => {
          // Only alert on a rising count — avoids firing on first load or when it drops
          // (admin marking an order as prepared/shipped shouldn't trigger a notification).
          if (
            prevCount.current !== null &&
            res.count > prevCount.current &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            const newOrders = res.count - prevCount.current
            new Notification("ZENTARO 새 주문", {
              body: `결제완료된 신규 주문이 ${newOrders}건 있습니다. (미처리 총 ${res.count}건)`,
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
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count}
    </span>
  )
}
