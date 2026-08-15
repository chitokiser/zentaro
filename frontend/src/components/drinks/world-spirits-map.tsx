"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import worldMap from "@/data/world-map.json"
import type { DrinkCountryCount } from "@/lib/auth-client"

/**
 * Maps the free-text `country` strings stored on drink products (as returned by
 * source APIs like Wine Vybe / TheCocktailDB / Beer9) onto the sovereign-country
 * names used by the Natural Earth 110m map dataset. UK constituent countries are
 * grouped under "United Kingdom" since the 110m map has no sub-national borders.
 * Anything not listed here simply isn't colored on the map (never guessed).
 */
const COUNTRY_NAME_TO_MAP_REGION: Record<string, string> = {
  scotland: "United Kingdom",
  wales: "United Kingdom",
  england: "United Kingdom",
  "northern ireland": "United Kingdom",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  usa: "United States of America",
  us: "United States of America",
  "united states": "United States of America",
  "united states of america": "United States of America",
  "south korea": "South Korea",
  korea: "South Korea",
  "czech republic": "Czechia",
  czechia: "Czechia",
  "north macedonia": "Macedonia",
  macedonia: "Macedonia",
  eswatini: "eSwatini",
  swaziland: "eSwatini",
}

function toMapRegion(country: string): string {
  const mapped = COUNTRY_NAME_TO_MAP_REGION[country.trim().toLowerCase()]
  return mapped ?? country
}

interface RegionAggregate {
  region: string
  total: number
  members: DrinkCountryCount[]
}

export function WorldSpiritsMap({ countries }: { countries: DrinkCountryCount[] }) {
  const router = useRouter()
  const [hovered, setHovered] = useState<{ region: string; x: number; y: number } | null>(null)

  const regionData = useMemo(() => {
    const byRegion = new Map<string, RegionAggregate>()
    countries.forEach((c) => {
      const region = toMapRegion(c.country)
      const existing = byRegion.get(region)
      if (existing) {
        existing.total += c.count
        existing.members.push(c)
      } else {
        byRegion.set(region, { region, total: c.count, members: [c] })
      }
    })
    return byRegion
  }, [countries])

  const maxCount = useMemo(() => Math.max(1, ...Array.from(regionData.values()).map((r) => r.total)), [regionData])

  function fillFor(region: string) {
    const agg = regionData.get(region)
    if (!agg) return "var(--card)"
    const step = Math.max(1, Math.ceil((Math.log(agg.total + 1) / Math.log(maxCount + 1)) * 4))
    const pct = [0, 30, 55, 78, 100][step] ?? 100
    return `color-mix(in oklab, var(--primary) ${pct}%, var(--card))`
  }

  function handleClick(region: string) {
    const agg = regionData.get(region)
    if (!agg) return
    const primary = agg.members.reduce((best, m) => (m.count > best.count ? m : best), agg.members[0])
    router.push(`/drinks/country/${encodeURIComponent(primary.country)}`)
  }

  const hoveredAgg = hovered ? regionData.get(hovered.region) : null

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-secondary/10">
      <svg
        viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}
        className="w-full"
        role="img"
        aria-label="Countries represented in the ZENTARO Global Drinks Database, by product count"
      >
        {worldMap.countries.map((c) => {
          const agg = regionData.get(c.name)
          return (
            <path
              key={c.name}
              d={c.path}
              fill={fillFor(c.name)}
              stroke="var(--background)"
              strokeWidth={0.5}
              className={agg ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}
              onMouseMove={(e) => {
                if (!agg) return
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
                if (!rect) return
                setHovered({ region: c.name, x: e.clientX - rect.left, y: e.clientY - rect.top })
              }}
              onMouseLeave={() => setHovered((h) => (h?.region === c.name ? null : h))}
              onClick={() => handleClick(c.name)}
            />
          )
        })}
      </svg>

      {hovered && hoveredAgg ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-border/60 bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: hovered.x + 12, top: hovered.y + 12 }}
        >
          <p className="font-semibold text-foreground">{hovered.region}</p>
          <p className="mt-0.5 text-muted-foreground">
            {hoveredAgg.total} product{hoveredAgg.total === 1 ? "" : "s"}
          </p>
          {hoveredAgg.members.length > 1 ? (
            <ul className="mt-1 space-y-0.5 border-t border-border/40 pt-1 text-[11px] text-muted-foreground">
              {hoveredAgg.members
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((m) => (
                  <li key={m.country} className="flex justify-between gap-2">
                    <span>{m.country}</span>
                    <span>{m.count}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-border/40 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>Fewer products</span>
        <div className="flex h-2.5 flex-1 max-w-[160px] overflow-hidden rounded-full">
          {[0, 30, 55, 78, 100].map((pct) => (
            <span key={pct} className="flex-1" style={{ background: `color-mix(in oklab, var(--primary) ${pct}%, var(--card))` }} />
          ))}
        </div>
        <span>More products</span>
      </div>
    </div>
  )
}
