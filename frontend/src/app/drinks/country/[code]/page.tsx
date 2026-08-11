import { DrinksCountryContent } from "@/components/drinks/drinks-country-content"

export default async function DrinksCountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <DrinksCountryContent country={decodeURIComponent(code)} />
}
