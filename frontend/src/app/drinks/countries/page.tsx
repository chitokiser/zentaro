import type { Metadata } from "next"
import { DrinksCountriesContent } from "@/components/drinks/drinks-countries-content"

export const metadata: Metadata = {
  title: "Drinks by Country — Explore the World of Spirits | ZENTARO",
  description: "Browse spirits, wine, beer and traditional drinks by country of origin on ZENTARO's Global Drinks Database.",
  alternates: { canonical: "/drinks/countries" },
}

export default function DrinksCountriesPage() {
  return <DrinksCountriesContent />
}
