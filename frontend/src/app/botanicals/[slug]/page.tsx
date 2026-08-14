import type { Metadata } from "next"
import { BotanicalDetailContent } from "@/components/drinks/botanical-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
const SITE_URL = "https://zentaro.netlify.app"

async function fetchIngredient(slug: string) {
  const res = await fetch(`${API_URL}/botanicals/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const { ingredient } = await res.json()
  return ingredient
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ingredient = await fetchIngredient(slug)
  if (!ingredient) return { title: "ZENTARO Botanicals" }

  const title = `${ingredient.name} | Botanical & Ingredient Profile | ZENTARO`
  const description = ingredient.description
    ? `${ingredient.description.slice(0, 150)}`
    : `Explore ${ingredient.name}, its use in spirits and cocktails, and related drinks on ZENTARO.`
  return { title, description, alternates: { canonical: `/botanicals/${slug}` } }
}

export default async function BotanicalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ingredient = await fetchIngredient(slug)

  return (
    <>
      {ingredient ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Botanicals", item: `${SITE_URL}/botanicals` },
                { "@type": "ListItem", position: 2, name: ingredient.name, item: `${SITE_URL}/botanicals/${slug}` },
              ],
            }),
          }}
        />
      ) : null}
      <BotanicalDetailContent slug={slug} />
    </>
  )
}
