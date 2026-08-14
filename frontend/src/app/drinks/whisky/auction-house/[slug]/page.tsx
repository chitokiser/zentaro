import type { Metadata } from "next"
import { WhiskyAuctionHouseDetailContent } from "@/components/whisky-market/whisky-auction-house-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
const SITE_URL = "https://zentaro.netlify.app"

async function fetchAuctionHouse(slug: string) {
  const res = await fetch(`${API_URL}/whisky-market/auction-houses/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const house = await fetchAuctionHouse(slug)
  if (!house) return { title: "ZENTARO Whisky Market" }

  const title = `${house.name} | Whisky Auction House Data | ZENTARO`
  const description = `Explore ${house.name} buyer/seller fees, trading volume and whisky auction market trends on ZENTARO Whisky Market.`
  return { title, description, alternates: { canonical: `/drinks/whisky/auction-house/${slug}` } }
}

export default async function WhiskyAuctionHouseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const house = await fetchAuctionHouse(slug)

  return (
    <>
      {house ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: house.name,
              url: house.url || undefined,
            }),
          }}
        />
      ) : null}
      {house ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Whisky Market", item: `${SITE_URL}/drinks/whisky` },
                { "@type": "ListItem", position: 2, name: "Auction Houses", item: `${SITE_URL}/drinks/whisky/auction-houses` },
                { "@type": "ListItem", position: 3, name: house.name, item: `${SITE_URL}/drinks/whisky/auction-house/${slug}` },
              ],
            }),
          }}
        />
      ) : null}
      <WhiskyAuctionHouseDetailContent slug={slug} />
    </>
  )
}
