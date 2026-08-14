import type { Metadata } from "next"
import { DrinksStatisticsContent } from "@/components/drinks/drinks-statistics-content"

export const metadata: Metadata = {
  title: "Global Drinks Database Statistics | ZENTARO",
  description: "Live statistics for ZENTARO's Global Drinks Database — total products, countries, producers, cocktails, ingredients and botanicals tracked.",
  alternates: { canonical: "/drinks/statistics" },
}

export default function DrinksStatisticsPage() {
  return <DrinksStatisticsContent />
}
