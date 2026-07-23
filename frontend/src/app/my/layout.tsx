"use client"

import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const TABS = [
    { label: t.nav.myPageItems.profile, href: "/my/profile" },
    { label: t.nav.myPageItems.mentor, href: "/my/mentor" },
    { label: t.nav.myPageItems.wallet, href: "/my/wallet" },
  ]

  return (
    <div>
      <PageHeader eyebrow={t.nav.myPage.label} title={t.myPage.layoutTitle} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 flex gap-2 border-b border-border/60 pb-3">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-full px-4 py-1.5 text-sm text-foreground/90 transition-colors hover:bg-secondary hover:text-primary"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}
