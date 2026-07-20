import { AdminNav } from "@/components/admin/admin-nav"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <aside className="lg:w-56 lg:shrink-0">
        <h1 className="font-display text-lg font-semibold text-primary">관리자</h1>
        <AdminNav />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
