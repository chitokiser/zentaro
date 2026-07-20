"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchMe } from "@/lib/auth-client"
import { OrdersNavBadge } from "@/components/admin/orders-nav-badge"

interface AdminSection {
  label: string
  href: string
  requiredLevel: 1 | 2 | 3
  badge?: boolean
}

const ADMIN_SECTIONS: AdminSection[] = [
  { label: "상품 관리", href: "/admin/products", requiredLevel: 2 },
  { label: "주문 관리", href: "/admin/orders", requiredLevel: 3, badge: true },
  { label: "입점 문의", href: "/admin/vendor-inquiries", requiredLevel: 3 },
  { label: "매출 장부", href: "/admin/sales-report", requiredLevel: 1 },
  { label: "회원 관리", href: "/admin/members", requiredLevel: 1 },
  { label: "Ticket 발급", href: "/admin/tickets", requiredLevel: 2 },
  { label: "현물출자 심사", href: "/admin/contributions", requiredLevel: 2 },
  { label: "웹진 관리", href: "/admin/webzine", requiredLevel: 2 },
  { label: "NFT 관리", href: "/admin/nft", requiredLevel: 2 },
  { label: "공지사항", href: "/admin/notices", requiredLevel: 2 },
  { label: "팝업 관리", href: "/admin/popups", requiredLevel: 2 },
  { label: "배너 관리", href: "/admin/banners", requiredLevel: 2 },
  { label: "영상 관리", href: "/admin/videos", requiredLevel: 2 },
  { label: "이벤트 관리", href: "/admin/events", requiredLevel: 2 },
]

const LEVEL_LABEL: Record<number, string> = {
  1: "최고관리자",
  2: "운영관리자",
  3: "스탭",
}

export function AdminNav() {
  const [adminLevel, setAdminLevel] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchMe()
      .then((me) => setAdminLevel(me.adminLevel))
      .catch(() => setAdminLevel(null))
      .finally(() => setLoaded(true))
  }, [])

  // Before the level is known, show every section rather than nothing —
  // each page's own API calls enforce the real permission via 403s.
  const visibleSections = ADMIN_SECTIONS.filter(
    (section) => !loaded || adminLevel === null || adminLevel <= section.requiredLevel,
  )

  return (
    <>
      {adminLevel ? (
        <p className="mb-3 text-xs text-muted-foreground">
          내 등급: <span className="font-medium text-primary">{LEVEL_LABEL[adminLevel]}</span>
        </p>
      ) : null}
      <nav className="mt-1 flex flex-row flex-wrap gap-1 lg:flex-col">
        {visibleSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-secondary hover:text-primary"
          >
            {section.label}
            {section.badge ? <OrdersNavBadge /> : null}
          </Link>
        ))}
      </nav>
    </>
  )
}
