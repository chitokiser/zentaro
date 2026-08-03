import type { MetadataRoute } from "next"

const BASE_URL = "https://zentaro.netlify.app"

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

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date()
    return STATIC_ENTRIES.map((entry) => ({
        url: `${BASE_URL}${entry.path}`,
        lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
    }))
}
