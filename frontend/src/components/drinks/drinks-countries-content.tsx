"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { fetchDrinkCountries, type DrinkCountryCount } from "@/lib/auth-client"
import { WorldSpiritsMap } from "@/components/drinks/world-spirits-map"

export function DrinksCountriesContent() {
  const [countries, setCountries] = useState<DrinkCountryCount[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDrinkCountries()
      .then(setCountries)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다."))
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="EXPLORE BY COUNTRY"
        title="Drinks by Country"
        description="Every country represented in the ZENTARO Global Drinks Database, ranked by number of products."
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && countries === null ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : null}
        {countries && countries.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 국가가 없습니다.</p>
        ) : null}
        {countries && countries.length > 0 ? (
          <div className="mb-10">
            <WorldSpiritsMap countries={countries} />
          </div>
        ) : null}
        {countries && countries.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {countries.map(({ country, count }) => (
              <Link
                key={country}
                href={`/drinks/country/${encodeURIComponent(country)}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-primary/50"
              >
                <span className="font-medium text-foreground">{country}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
