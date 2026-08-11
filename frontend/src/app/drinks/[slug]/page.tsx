import type { Metadata } from "next"
import { DrinkDetailContent } from "@/components/drinks/drink-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await fetch(`${API_URL}/drinks/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error("not found")
    const { product } = await res.json()
    return {
      title: `${product.name} | ${product.category ?? "Drink"} Information & Rating | ZENTARO`,
      description: `Explore ${product.name} information, rating, producer, ABV and related drinks on ZENTARO Global Drinks.`,
      alternates: { canonical: `/drinks/${slug}` },
    }
  } catch {
    return { title: "ZENTARO Global Drinks" }
  }
}

export default async function DrinkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <DrinkDetailContent slug={slug} />
}
