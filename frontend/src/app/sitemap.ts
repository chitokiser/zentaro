import type { MetadataRoute } from "next"

const BASE_URL = "https://zentaro.netlify.app"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

interface Entry {
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority: number
}

const STATIC_ENTRIES: Entry[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/about/company", changeFrequency: "monthly", priority: 0.8 },
    { path: "/about/distillery", changeFrequency: "monthly", priority: 0.7 },
    { path: "/about/research-lab", changeFrequency: "monthly", priority: 0.6 },
    { path: "/about/products", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about/business", changeFrequency: "monthly", priority: 0.6 },
    { path: "/about/smart-contract", changeFrequency: "monthly", priority: 0.6 },
    { path: "/about/certifications", changeFrequency: "yearly", priority: 0.5 },
    { path: "/mall", changeFrequency: "daily", priority: 0.9 },
    { path: "/webzine", changeFrequency: "weekly", priority: 0.7 },
    { path: "/rewards/bottle-cap", changeFrequency: "monthly", priority: 0.6 },
    { path: "/rewards/contribution", changeFrequency: "monthly", priority: 0.5 },
    { path: "/rewards/barrel-reserve", changeFrequency: "monthly", priority: 0.6 },
    { path: "/rewards/dao-staking", changeFrequency: "monthly", priority: 0.6 },
    { path: "/exchange", changeFrequency: "daily", priority: 0.6 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
    { path: "/community", changeFrequency: "weekly", priority: 0.5 },
    { path: "/vendor-inquiry", changeFrequency: "yearly", priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
]

function entry(path: string, changeFrequency: Entry["changeFrequency"], priority: number, lastModified: Date): MetadataRoute.Sitemap[number] {
    return { url: `${BASE_URL}${path}`, lastModified, changeFrequency, priority }
}

/**
 * Real, currently-indexable content only — no fabricated/placeholder URLs (Gin category
 * pages etc. don't exist yet because there's no real gin product data behind them).
 * Falls back to just the static entries if the backend is unreachable at build time so a
 * backend outage never breaks the whole site's sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const lastModified = new Date()
    const staticEntries = STATIC_ENTRIES.map((e) => entry(e.path, e.changeFrequency, e.priority, lastModified))

    try {
        const [searchRes, distilleriesRes, auctionHousesRes, producersRes] = await Promise.all([
            fetch(`${API_URL}/drinks/search?q=`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/whisky-market/distilleries`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/whisky-market/auction-houses`, { next: { revalidate: 3600 } }),
            fetch(`${API_URL}/drinks/producers`, { next: { revalidate: 3600 } }),
        ])
        if (!searchRes.ok || !distilleriesRes.ok || !auctionHousesRes.ok || !producersRes.ok) return staticEntries

        const [search, distilleries, auctionHouses, producers] = await Promise.all([
            searchRes.json() as Promise<{
                products: { slug: string }[]
                cocktails: { id: string }[]
                ingredients: { slug: string }[]
            }>,
            distilleriesRes.json() as Promise<{ slug: string }[]>,
            auctionHousesRes.json() as Promise<{ slug: string }[]>,
            producersRes.json() as Promise<{ slug: string }[]>,
        ])

        const productEntries = search.products.map((p) => entry(`/drinks/${p.slug}`, "monthly", 0.7, lastModified))
        const cocktailEntries = search.cocktails.map((c) => entry(`/drinks/cocktails/${c.id}`, "yearly", 0.4, lastModified))
        const ingredientEntries = search.ingredients.map((i) => entry(`/botanicals/${i.slug}`, "yearly", 0.5, lastModified))
        const distilleryEntries = distilleries.map((d) =>
            entry(`/drinks/whisky/distillery/${d.slug}`, "monthly", 0.6, lastModified),
        )
        const auctionHouseEntries = auctionHouses.map((a) =>
            entry(`/drinks/whisky/auction-house/${a.slug}`, "monthly", 0.5, lastModified),
        )
        const producerEntries = producers.map((p) => entry(`/drinks/producers/${p.slug}`, "yearly", 0.4, lastModified))

        return [
            ...staticEntries,
            ...productEntries,
            ...cocktailEntries,
            ...ingredientEntries,
            ...distilleryEntries,
            ...auctionHouseEntries,
            ...producerEntries,
        ]
    } catch {
        return staticEntries
    }
}
