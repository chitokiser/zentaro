import type { Metadata } from "next"
import { Suspense } from "react"
import { DrinksPageContent } from "@/components/drinks/drinks-page-content"

export const metadata: Metadata = {
  title: "ZENTARO Global Drinks | Spirits, Wine, Beer & Botanicals Database",
  description:
    "Discover drinks, spirits, ingredients, botanicals and flavors from around the world — search, rankings, ratings, and related cocktails, all connected.",
  alternates: { canonical: "/drinks" },
}

export default function DrinksPage() {
  return (
    <Suspense fallback={null}>
      <DrinksPageContent />
    </Suspense>
  )
}
