"use client"

import Image from "next/image"
import Link from "next/link"
import { Clapperboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText } from "@/lib/i18n/content"
import type { WebzinePost } from "@/lib/api"
import { getPostThumbnail } from "@/lib/webzine-thumbnail"

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function CinemaSpiritsList({ posts }: { posts: WebzinePost[] }) {
  const { t, locale } = useI18n()
  const c = t.webzine.cinema

  return (
    <div>
      <div className="border-b border-border/60 bg-card/40 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-center">
            <Clapperboard className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">{c.eyebrow}</span>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm italic text-muted-foreground sm:text-base">{c.catchphrase}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 text-right">
          <Link href="/webzine" className="text-xs text-primary hover:underline">
            {c.backToAll}
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.webzine.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => {
              const thumbnail = getPostThumbnail(post)
              const postTitle =
                locale === "ko" && post.titleKo ? post.titleKo : localizedText(locale, post.title, post.titleEn, post.titleVi)
              const postContentHtml =
                locale === "ko" && post.contentHtmlKo
                  ? post.contentHtmlKo
                  : localizedText(locale, post.contentHtml, post.contentHtmlEn, post.contentHtmlVi)

              return (
                <Link
                  key={post.id}
                  href={`/webzine/${post.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/60"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    {thumbnail ? (
                      thumbnail.isVideoFrame ? (
                        <video src={thumbnail.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      ) : (
                        <Image
                          src={thumbnail.url}
                          alt={postTitle}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Clapperboard className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    {post.movieTitle || post.drinkType ? (
                      <div className="flex flex-wrap gap-1">
                        {post.movieTitle ? (
                          <Badge variant="default" className="text-[10px]">
                            🎬 {post.movieTitle}
                          </Badge>
                        ) : null}
                        {post.drinkType ? (
                          <Badge variant="outline" className="text-[10px]">
                            🥃 {post.drinkType}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                    <h3 className="font-display text-sm font-medium leading-snug">{postTitle}</h3>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{stripHtml(postContentHtml)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
