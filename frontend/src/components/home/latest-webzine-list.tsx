"use client"

import Image from "next/image"
import Link from "next/link"
import { Newspaper } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText } from "@/lib/i18n/content"
import type { WebzinePost } from "@/lib/api"
import { getPostThumbnail } from "@/lib/webzine-thumbnail"

export function LatestWebzineList({ posts }: { posts: WebzinePost[] }) {
  const { t, locale } = useI18n()

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
            {t.home.webzine.eyebrow}
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{t.home.webzine.title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t.home.webzine.description}</p>
        </div>
        <Link href="/webzine" className="text-sm text-primary hover:underline">
          {t.home.webzine.viewAll}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.home.webzine.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {posts.map((post) => {
            const thumbnail = getPostThumbnail(post)
            const postTitle =
              locale === "ko" && post.titleKo ? post.titleKo : localizedText(locale, post.title, post.titleEn, post.titleVi)

            return (
              <Link
                key={post.id}
                href={`/webzine/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/60"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  {thumbnail ? (
                    thumbnail.isVideoFrame ? (
                      <video src={thumbnail.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={thumbnail.url}
                        alt={postTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Newspaper className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug">{postTitle}</h3>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
