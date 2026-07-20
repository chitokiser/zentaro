"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export function CartBadge() {
  const { totalCount } = useCart()

  return (
    <Link
      href="/checkout"
      className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground/90 hover:bg-secondary hover:text-primary"
    >
      <ShoppingCart className="size-4" />
      {totalCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {totalCount}
        </span>
      ) : null}
    </Link>
  )
}
