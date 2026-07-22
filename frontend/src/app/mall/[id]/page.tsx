import { notFound } from "next/navigation"
import { ProductDetailView } from "@/components/mall/product-detail-view"
import { getProduct } from "@/lib/api"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return <ProductDetailView product={product} />
}
