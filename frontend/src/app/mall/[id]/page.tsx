import { notFound } from "next/navigation"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { ProductPurchasePanel } from "@/components/mall/product-purchase-panel"
import { getProduct } from "@/lib/api"

const FULFILLMENT_LABEL: Record<string, string> = {
  dropshipping: "드랍쉬핑",
  direct: "직배송(자체재고)",
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

  return (
    <div>
      <PageHeader eyebrow="ZENTARO Mall" title={product.name} />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/60">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {product.category}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {product.category}
              </Badge>
              <Badge variant="secondary">
                {FULFILLMENT_LABEL[product.fulfillmentType ?? "dropshipping"]}
              </Badge>
            </div>
            <p className="font-display text-2xl font-semibold text-primary">
              {product.priceAp.toLocaleString()} AP
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
