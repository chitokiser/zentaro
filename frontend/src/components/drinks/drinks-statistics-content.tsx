"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { fetchDrinkStatistics, type DrinkStatistics } from "@/lib/auth-client"

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-primary">{value}</p>
    </div>
  )
}

export function DrinksStatisticsContent() {
  const [stats, setStats] = useState<DrinkStatistics | null>(null)

  useEffect(() => {
    fetchDrinkStatistics().then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <div>
      <PageHeader eyebrow="STATISTICS" title="Global Drinks Statistics" description="How large ZENTARO's drinks database is, and how fresh." />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        {!stats ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total Products" value={stats.totalProducts.toLocaleString()} />
            <StatCard label="Total Countries" value={stats.totalCountries.toLocaleString()} />
            <StatCard label="Total Producers" value={stats.totalProducers.toLocaleString()} />
            <StatCard label="Total Cocktails" value={stats.totalCocktails.toLocaleString()} />
            <StatCard label="Total Ingredients" value={stats.totalIngredients.toLocaleString()} />
            <StatCard label="Total Botanicals" value={stats.totalBotanicals.toLocaleString()} />
            <StatCard label="New This Month" value={stats.newProductsThisMonth.toLocaleString()} />
            <StatCard
              label="Last Updated"
              value={stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString("ko-KR") : "N/A"}
            />
          </div>
        )}
      </div>
    </div>
  )
}
