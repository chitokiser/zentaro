import { PageHeader } from "@/components/page-header"
import { ProductCard } from "@/components/mall/product-card"
import { getFeaturedProducts } from "@/lib/api"

export default async function MallPage() {
  const products = await getFeaturedProducts()

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="ZENTARO Mall"
        description="드랍쉬핑·직배송 상품을 AP(Reward Point)와 EXP로 만나보세요. 원가를 제외한 마진은 EXP로 결제할 수 있습니다."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
