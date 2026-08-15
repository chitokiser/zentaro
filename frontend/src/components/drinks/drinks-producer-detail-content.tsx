"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchDrinkProducer, type DrinkProducer, type DrinkProduct } from "@/lib/auth-client"

const TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery",
  distillery: "Distillery",
}

const SOURCE_LABELS: Record<string, string> = {
  openbrewerydb: "Open Brewery DB",
  wikidata: "Wikidata",
}

export function DrinksProducerDetailContent({ slug }: { slug: string }) {
  const [data, setData] = useState<{ producer: DrinkProducer; relatedProducts: DrinkProduct[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDrinkProducer(slug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
  }, [slug])

  if (error) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-destructive">{error}</div>
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-muted-foreground">불러오는 중...</div>

  const { producer, relatedProducts } = data
  const location = [producer.city, producer.region, producer.country].filter(Boolean).join(", ")
  const mapUrl =
    producer.lat != null && producer.lng != null
      ? `https://www.openstreetmap.org/?mlat=${producer.lat}&mlon=${producer.lng}#map=14/${producer.lat}/${producer.lng}`
      : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/drinks/producers" className="mb-6 inline-block text-xs text-primary underline underline-offset-4">
        ← Breweries & Distilleries
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
            {TYPE_LABELS[producer.producerType] ?? producer.producerType}
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">{producer.name}</h1>
          {location ? <p className="mt-1 text-sm text-muted-foreground">{location}</p> : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {producer.website ? (
          <a
            href={producer.website}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border/60 px-4 py-2 text-foreground transition-colors hover:border-primary/50"
          >
            Official Website →
          </a>
        ) : null}
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border/60 px-4 py-2 text-foreground transition-colors hover:border-primary/50"
          >
            View on Map →
          </a>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {producer.foundedYear ? (
          <div className="rounded-lg border border-border/60 bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Founded</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">{producer.foundedYear}</p>
          </div>
        ) : null}
        {producer.address ? (
          <div className="rounded-lg border border-border/60 bg-card p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Address</p>
            <p className="mt-1 text-sm text-foreground">{producer.address}</p>
          </div>
        ) : null}
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
            Products from {producer.name} in ZENTARO&apos;s Drinks Database
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedProducts.map((p) => (
              <Link
                key={p.slug}
                href={`/drinks/${p.slug}`}
                className="rounded-lg border border-border/60 bg-card p-4 text-sm transition-colors hover:border-primary/50"
              >
                <p className="font-medium text-foreground">{p.name}</p>
                {p.subCategory ? <p className="mt-1 text-xs text-muted-foreground">{p.subCategory}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-muted-foreground">
        Source: {SOURCE_LABELS[producer.source] ?? producer.source} · {producer.sourceLicense}
        {producer.sourceUrl ? (
          <>
            {" "}
            ·{" "}
            <a href={producer.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
              View source record
            </a>
          </>
        ) : null}
      </p>
    </div>
  )
}
