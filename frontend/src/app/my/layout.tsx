import Link from "next/link"
import { PageHeader } from "@/components/page-header"

const TABS = [
  { label: "Profile", href: "/my/profile" },
  { label: "Mentor", href: "/my/mentor" },
  { label: "My Wallet", href: "/my/wallet" },
]

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader eyebrow="My Page" title="마이페이지" />
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
