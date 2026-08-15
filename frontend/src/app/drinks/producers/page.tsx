import type { Metadata } from "next"
import { DrinksProducersContent } from "@/components/drinks/drinks-producers-content"

export const metadata: Metadata = {
  title: "Breweries & Distilleries Worldwide | ZENTARO Global Drinks Database",
  description: "A global directory of breweries and distilleries, sourced from Open Brewery DB and Wikidata, on ZENTARO's Global Drinks Database.",
  alternates: { canonical: "/drinks/producers" },
}

export default function DrinksProducersPage() {
  return <DrinksProducersContent />
}
