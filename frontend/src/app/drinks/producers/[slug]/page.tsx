import type { Metadata } from "next"
import { DrinksProducerDetailContent } from "@/components/drinks/drinks-producer-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
const SITE_URL = "https://zentaro.netlify.app"

async function fetchProducer(slug: string) {
  const res = await fetch(`${API_URL}/drinks/producers/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchProducer(slug)
  if (!data) return { title: "ZENTARO Global Drinks Database" }

  const { producer } = data
  const typeLabel = producer.producerType === "distillery" ? "Distillery" : "Brewery"
  const location = [producer.city, producer.country].filter(Boolean).join(", ")
  const title = `${producer.name} — ${typeLabel}${location ? ` in ${location}` : ""} | ZENTARO`
  const description = `${producer.name} is a ${typeLabel.toLowerCase()}${location ? ` in ${location}` : ""} in ZENTARO's Global Drinks Database, sourced from ${producer.source === "wikidata" ? "Wikidata" : "Open Brewery DB"}.`
  return { title, description, alternates: { canonical: `/drinks/producers/${slug}` } }
}

export default async function DrinksProducerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await fetchProducer(slug)
  const producer = data?.producer

  return (
    <>
      {producer ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": producer.producerType === "distillery" ? "Distillery" : "Brewery",
              name: producer.name,
              url: producer.website || undefined,
              address: producer.country
                ? { "@type": "PostalAddress", addressLocality: producer.city || undefined, addressCountry: producer.country }
                : undefined,
              geo:
                producer.lat != null && producer.lng != null
                  ? { "@type": "GeoCoordinates", latitude: producer.lat, longitude: producer.lng }
                  : undefined,
            }),
          }}
        />
      ) : null}
      {producer ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Breweries & Distilleries", item: `${SITE_URL}/drinks/producers` },
                { "@type": "ListItem", position: 2, name: producer.name, item: `${SITE_URL}/drinks/producers/${slug}` },
              ],
            }),
          }}
        />
      ) : null}
      <DrinksProducerDetailContent slug={slug} />
    </>
  )
}
