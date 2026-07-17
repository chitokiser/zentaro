import Link from "next/link"

const ADMIN_SECTIONS = [
  { label: "상품 관리", href: "/admin/products" },
  { label: "회원 관리", href: "/admin/members" },
  { label: "Ticket 발급", href: "/admin/tickets" },
  { label: "NFT 관리", href: "/admin/nft" },
  { label: "공지사항", href: "/admin/notices" },
  { label: "팝업 관리", href: "/admin/popups" },
  { label: "배너 관리", href: "/admin/banners" },
  { label: "영상 관리", href: "/admin/videos" },
  { label: "이벤트 관리", href: "/admin/events" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <aside className="lg:w-56 lg:shrink-0">
        <h1 className="font-display text-lg font-semibold text-primary">관리자</h1>
        <nav className="mt-4 flex flex-row flex-wrap gap-1 lg:flex-col">
          {ADMIN_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-secondary hover:text-primary"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
