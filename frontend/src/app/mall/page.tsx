import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/mall/product-card"
import { getFeaturedProducts } from "@/lib/api"
import { MALL_MAIN_CATEGORIES } from "@/lib/mall-categories"

export default async function MallPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const products = await getFeaturedProducts(category)

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="ZENTARO Mall"
        description={<>드랍쉬핑·직배송 상품을 ZP(Reward Point)와 <span className="notranslate">EXP</span>로 만나보세요.</>}
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/mall">
            <Badge variant={!category ? "default" : "outline"} className="cursor-pointer">
              전체
            </Badge>
          </Link>
          {MALL_MAIN_CATEGORIES.map((c) => (
            <Link key={c} href={`/mall?category=${encodeURIComponent(c)}`}>
              <Badge variant={category === c ? "default" : "outline"} className="cursor-pointer">
                {c}
              </Badge>
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">해당 카테고리에 등록된 상품이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
