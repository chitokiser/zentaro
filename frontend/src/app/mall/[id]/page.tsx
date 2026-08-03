import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetailView } from "@/components/mall/product-detail-view"
import { getProduct } from "@/lib/api"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return {}

  const title = `${product.name} | ZENTARO Mall`
  const description = product.description?.slice(0, 160) || `ZENTARO Mall에서 ${product.name}을(를) 만나보세요.`

  return {
    title,
    description,
    alternates: { canonical: `/mall/${id}` },
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  }
}

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
