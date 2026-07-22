import { getFeaturedProducts } from "@/lib/api"
import { ShoppingMallCopy } from "@/components/home/shopping-mall-copy"
import { FeaturedProductsGrid } from "@/components/home/featured-products-grid"
import { ShoppingMallViewAll } from "@/components/home/shopping-mall-view-all"

export async function ShoppingMall() {
  const products = await getFeaturedProducts()

  return (
    <section className="border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ShoppingMallCopy />
        <FeaturedProductsGrid products={products} />
        <ShoppingMallViewAll />
      </div>
    </section>
  )
}
