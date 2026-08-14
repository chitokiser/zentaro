import type { Metadata } from "next"
import { DrinkDetailContent } from "@/components/drinks/drink-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
const SITE_URL = "https://zentaro.netlify.app"

async function fetchProduct(slug: string) {
  const res = await fetch(`${API_URL}/drinks/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const { product } = await res.json()
  return product
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: "ZENTARO Global Drinks" }

  const title = `${product.name} | ${product.category ?? "Drink"} Information & Rating | ZENTARO`
  const description = `Explore ${product.name} information, rating, producer, ABV and related drinks on ZENTARO Global Drinks.`
  return {
    title,
    description,
    alternates: { canonical: `/drinks/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/drinks/${slug}`,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      type: "website",
    },
  }
}

export default async function DrinkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)

  return (
    <>
      {product ? (
        <script
          type="application/ld+json"
          // Only fields the API actually returns — no invented ratings/prices (see backend/src/drinks/README.md §4).
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              image: product.imageUrl || undefined,
              description: product.description || undefined,
              brand: product.producerName ? { "@type": "Brand", name: product.producerName } : undefined,
              category: product.subCategory || product.category || undefined,
              aggregateRating: product.externalRatings?.[0]
                ? {
                    "@type": "AggregateRating",
                    ratingValue: product.externalRatings[0].rating,
                    reviewCount: product.externalRatings[0].ratingCount,
                    bestRating: 100,
                  }
                : undefined,
            }),
          }}
        />
      ) : null}
      {product ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Global Drinks", item: `${SITE_URL}/drinks` },
                { "@type": "ListItem", position: 2, name: product.name, item: `${SITE_URL}/drinks/${slug}` },
              ],
            }),
          }}
        />
      ) : null}
      <DrinkDetailContent slug={slug} />
    </>
  )
}
