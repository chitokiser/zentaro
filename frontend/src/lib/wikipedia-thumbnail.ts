"use client"

import { useEffect, useState } from "react"

interface WikiThumbnailResult {
    thumbnail: string | null
    pageUrl: string | null
}

const cache = new Map<string, WikiThumbnailResult | "loading" | "error">()

/**
 * Lazily resolves a Wikipedia thumbnail image + article link for a species
 * name, fetching only once the element attached via `ref` scrolls into view.
 * Results are cached in-memory for the page's lifetime so the same species
 * (e.g. reused across cards) is never fetched twice.
 */
export function useWikipediaThumbnail(query: string) {
    const [result, setResult] = useState<WikiThumbnailResult | null>(() => {
        const cached = cache.get(query)
        return cached && cached !== "loading" && cached !== "error" ? cached : null
    })
    const [node, setNode] = useState<Element | null>(null)

    useEffect(() => {
        if (!query || !node) return
        const cached = cache.get(query)
        if (cached && cached !== "loading") {
            if (cached !== "error") setResult(cached)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return
                observer.disconnect()
                cache.set(query, "loading")
                const title = encodeURIComponent(query.trim().replace(/ /g, "_"))
                fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
                    .then((res) => (res.ok ? res.json() : null))
                    .then((data) => {
                        const value: WikiThumbnailResult = {
                            thumbnail: data?.thumbnail?.source ?? null,
                            pageUrl: data?.content_urls?.desktop?.page ?? null,
                        }
                        cache.set(query, value)
                        setResult(value)
                    })
                    .catch(() => cache.set(query, "error"))
            },
            { rootMargin: "200px" },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [node, query])

    return { thumbnail: result?.thumbnail ?? null, pageUrl: result?.pageUrl ?? null, ref: setNode }
}
