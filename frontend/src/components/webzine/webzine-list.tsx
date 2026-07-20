"use client"

import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/i18n-context"
import type { WebzinePost } from "@/lib/api"
import { getYoutubeThumbnail, isDirectVideoFile } from "@/lib/video-utils"

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function extractThumbnail(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

function getPostThumbnail(post: WebzinePost): { url: string; isVideoFrame: boolean } | null {
  const imgThumbnail = extractThumbnail(post.contentHtml)
  if (imgThumbnail) return { url: imgThumbnail, isVideoFrame: false }
  if (!post.videoUrl) return null
  const ytThumb = getYoutubeThumbnail(post.videoUrl)
  if (ytThumb) return { url: ytThumb, isVideoFrame: false }
  if (isDirectVideoFile(post.videoUrl)) return { url: post.videoUrl, isVideoFrame: true }
  return null
}

export function WebzineList({
  posts,
  tags,
  activeTag,
}: {
  posts: WebzinePost[]
  tags: readonly string[]
  activeTag?: string
}) {
  const { t } = useI18n()

  return (
    <div>
      <PageHeader eyebrow={t.webzine.eyebrow} title={t.webzine.title} description={t.webzine.description} />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/webzine">
            <Badge variant={!activeTag ? "default" : "outline"} className="cursor-pointer">
              {t.webzine.all}
            </Badge>
          </Link>
          {tags.map((tag) => (
            <Link key={tag} href={`/webzine?tag=${encodeURIComponent(tag)}`}>
              <Badge variant={activeTag === tag ? "default" : "outline"} className="cursor-pointer">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.webzine.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const thumbnail = getPostThumbnail(post)
              return (
                <Link
                  key={post.id}
                  href={`/webzine/${post.id}`}
                  className="flex flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/60"
                >
                  {thumbnail && (
                    <div className="relative -mx-4 -mt-4 mb-1 aspect-video overflow-hidden bg-black">
                      {thumbnail.isVideoFrame ? (
                        <video
                          src={thumbnail.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={thumbnail.url}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-display text-base font-medium">{post.title}</h3>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {stripHtml(post.contentHtml)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
