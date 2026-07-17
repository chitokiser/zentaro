import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { getFeaturedProducts } from "@/lib/api"

export default async function MallPage() {
  const products = await getFeaturedProducts()

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="ZENTARO Mall"
        description="관리자가 지정한 대표 상품을 AP(Reward Point)로 만나보세요. (CJ Dropshipping 배송 연동)"
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="flex aspect-square items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
                {product.category}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <Badge
                  variant="outline"
                  className="w-fit border-primary/40 text-[10px] text-primary"
                >
                  {product.category}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {product.priceAp.toLocaleString()} AP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
