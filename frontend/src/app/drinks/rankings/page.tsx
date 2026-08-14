import type { Metadata } from "next"
import { DrinksRankingsContent } from "@/components/drinks/drinks-rankings-content"

export const metadata: Metadata = {
  title: "Drinks Rankings — Top Rated, Most Reviewed & New Releases | ZENTARO",
  description: "Confidence-weighted rankings of spirits, wine, beer and traditional drinks by rating, review count and new releases on ZENTARO Global Drinks.",
  alternates: { canonical: "/drinks/rankings" },
}

export default function DrinksRankingsPage() {
  return <DrinksRankingsContent />
}
