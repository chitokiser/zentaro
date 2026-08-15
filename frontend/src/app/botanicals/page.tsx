"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { fetchBotanicals, type DrinkIngredient } from "@/lib/auth-client"

export default function BotanicalsPage() {
  const [items, setItems] = useState<DrinkIngredient[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchBotanicals(!showAll).then(setItems).catch(() => setItems([]))
  }, [showAll])

  return (
    <div>
      <PageHeader
        eyebrow="BOTANICAL DATABASE"
        title="Botanicals & Ingredients"
        description="Herbs, spices, roots, seeds, flowers, fruits and peels used across the world's drinks — and the cocktails and spirits that use them."
      />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-2">
          <Badge variant={!showAll ? "default" : "outline"} className="cursor-pointer" onClick={() => setShowAll(false)}>
            Botanicals only
          </Badge>
          <Badge variant={showAll ? "default" : "outline"} className="cursor-pointer" onClick={() => setShowAll(true)}>
            All ingredients
          </Badge>
        </div>
        {items === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 항목이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((i) => (
              <Link
                key={i.id}
                href={`/botanicals/${i.slug}`}
                className="overflow-hidden rounded-lg border border-border/60 bg-card text-sm hover:border-primary/50"
              >
                {i.imageUrl ? (
                  <div className="relative aspect-square w-full bg-secondary/20">
                    <Image src={i.imageUrl} alt={i.name} fill className="object-cover" sizes="200px" />
                  </div>
                ) : null}
                <div className="p-3">
                  <span className="font-medium">{i.name}</span>
                  {i.isBotanical ? <span className="ml-1">🌿</span> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{i.botanicalCategory ?? i.type ?? "N/A"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
