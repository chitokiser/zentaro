import type { Metadata } from "next"
import { WhiskyAuctionHousesContent } from "@/components/whisky-market/whisky-auction-houses-content"

export const metadata: Metadata = {
  title: "Whisky Auction Houses | ZENTARO Whisky Market",
  description: "Whisky auction houses tracked by ZENTARO Whisky Market, with real buyer's fee, seller's fee and trading volume data.",
  alternates: { canonical: "/drinks/whisky/auction-houses" },
}

export default function WhiskyAuctionHousesPage() {
  return <WhiskyAuctionHousesContent />
}
