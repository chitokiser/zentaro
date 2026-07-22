import { MallPageContent } from "@/components/mall/mall-page-content"
import { getFeaturedProducts } from "@/lib/api"

export default async function MallPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const products = await getFeaturedProducts(category)

  return <MallPageContent initialProducts={products} category={category} />
}
