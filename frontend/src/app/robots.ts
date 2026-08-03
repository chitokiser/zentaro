import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/checkout", "/my/"],
        },
        sitemap: "https://zentaro.netlify.app/sitemap.xml",
    }
}
