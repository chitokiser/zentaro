"use client"

import { useEffect, useState } from "react"
import { fetchUnreadOrderCount } from "@/lib/auth-client"

export function OrdersNavBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function poll() {
      fetchUnreadOrderCount()
        .then((res) => setCount(res.count))
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
