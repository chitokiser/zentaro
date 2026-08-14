import type { Metadata } from "next"
import { WhiskyMarketDashboardContent } from "@/components/whisky-market/whisky-market-dashboard-content"

export const metadata: Metadata = {
  title: "Global Whisky Market — Auction Prices & Distillery Data | ZENTARO",
  description: "Track whisky auction market trends, distillery statistics and auction house data from around the world on ZENTARO Whisky Market.",
  alternates: { canonical: "/drinks/whisky" },
}

export default function WhiskyMarketPage() {
  return <WhiskyMarketDashboardContent />
}
