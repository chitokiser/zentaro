import type { Metadata } from "next"
import { MallPageContent } from "@/components/mall/mall-page-content"
import { getFeaturedProducts } from "@/lib/api"

export const metadata: Metadata = {
  title: "ZENTARO Mall | 프리미엄 증류주 & 보태니컬 쇼핑몰",
  description:
    "ZENTARO Mall — 시그니처 드라이진, 명품 증류식 소주, 프리미엄 리큐르와 오크 배럴까지. ZP·ZTARO 토큰 결제와 EXP 리워드로 만나는 프리미엄 증류주 쇼핑몰.",
  alternates: { canonical: "/mall" },
}

export default async function MallPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const products = await getFeaturedProducts(category)

  return <MallPageContent initialProducts={products} category={category} />
}
