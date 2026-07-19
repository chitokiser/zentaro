import Image from "next/image"
import Link from "next/link"
import { getFeaturedProducts } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

export async function ShoppingMall() {
  const products = await getFeaturedProducts()

  return (
    <section className="border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
            ZENTARO Mall
          </span>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            프리미엄 쇼핑몰
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            관리자가 지정한 대표 상품을 AP(Reward Point)로 만나보세요.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 10).map((product) => (
            <Link
              key={product.id}
              href="/mall"
              className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/60"
            >
              <div className="relative flex aspect-square items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  product.category
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <Badge
                  variant="outline"
                  className="w-fit border-primary/40 text-[10px] text-primary"
                >
                  {product.category}
                </Badge>
                <span className="text-sm font-medium text-foreground group-hover:text-primary">
                  {product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {product.priceAp.toLocaleString()} AP
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/mall"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            전체 상품 보러가기 →
          </Link>
        </div>
      </div>
    </section>
  )
}
