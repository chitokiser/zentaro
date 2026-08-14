import type { Metadata } from "next"
import { DrinksCountryContent } from "@/components/drinks/drinks-country-content"

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const country = decodeURIComponent(code)
  return {
    title: `${country} Spirits & Drinks | ZENTARO Global Drinks`,
    description: `Explore spirits and drinks from ${country} — products, producers and ratings on ZENTARO's Global Drinks Database.`,
    alternates: { canonical: `/drinks/country/${code}` },
  }
}

export default async function DrinksCountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <DrinksCountryContent country={decodeURIComponent(code)} />
}
