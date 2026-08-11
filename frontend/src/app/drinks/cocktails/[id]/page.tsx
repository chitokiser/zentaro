import { CocktailDetailContent } from "@/components/drinks/cocktail-detail-content"

export default async function CocktailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CocktailDetailContent id={id} />
}
