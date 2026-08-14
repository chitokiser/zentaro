import type { Metadata } from "next"
import { CocktailDetailContent } from "@/components/drinks/cocktail-detail-content"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

async function fetchCocktail(id: string) {
  const res = await fetch(`${API_URL}/drinks/cocktails/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const cocktail = await fetchCocktail(id)
  if (!cocktail) return { title: "ZENTARO Global Drinks" }

  const title = `${cocktail.name} Cocktail Recipe | ZENTARO`
  const description = cocktail.instructions
    ? cocktail.instructions.slice(0, 150)
    : `${cocktail.name} cocktail recipe, ingredients and instructions on ZENTARO.`
  return { title, description, alternates: { canonical: `/drinks/cocktails/${id}` } }
}

export default async function CocktailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CocktailDetailContent id={id} />
}
