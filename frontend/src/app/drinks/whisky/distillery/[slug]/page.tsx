import type { Metadata } from "next"
import { WhiskyDistilleryDetailContent } from "@/components/whisky-market/whisky-distillery-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
const SITE_URL = "https://zentaro.netlify.app"

async function fetchDistillery(slug: string) {
  const res = await fetch(`${API_URL}/whisky-market/distilleries/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const distillery = await fetchDistillery(slug)
  if (!distillery) return { title: "ZENTARO Whisky Market" }

  const title = `${distillery.name} Distillery | Whisky Market Data | ZENTARO`
  const description = `Explore ${distillery.name} distillery whisky auction prices, market trends and trading volume on ZENTARO Whisky Market.`
  return { title, description, alternates: { canonical: `/drinks/whisky/distillery/${slug}` } }
}

export default async function WhiskyDistilleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const distillery = await fetchDistillery(slug)

  return (
    <>
      {distillery ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: distillery.name,
              address: distillery.country ? { "@type": "PostalAddress", addressCountry: distillery.country } : undefined,
            }),
          }}
        />
      ) : null}
      {distillery ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Whisky Market", item: `${SITE_URL}/drinks/whisky` },
                { "@type": "ListItem", position: 2, name: distillery.name, item: `${SITE_URL}/drinks/whisky/distillery/${slug}` },
              ],
            }),
          }}
        />
      ) : null}
      <WhiskyDistilleryDetailContent slug={slug} />
    </>
  )
}
