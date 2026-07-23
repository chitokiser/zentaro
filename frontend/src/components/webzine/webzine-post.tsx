"use client"

import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/i18n-context"
import { localizedText } from "@/lib/i18n/content"
import type { WebzinePost } from "@/lib/api"

const ZENTARO_URL = "https://zentaro.netlify.app/"

export function WebzinePostView({
  post,
  embedUrl,
  directVideo,
}: {
  post: WebzinePost
  embedUrl: string | null
  directVideo: string | null
}) {
  const { t, locale } = useI18n()
  const authorLabel = post.source === "ai" ? "ZENTARO AI" : post.authorName
  const postTitle = locale === "ko" && post.titleKo ? post.titleKo : localizedText(locale, post.title, post.titleEn, post.titleVi)
  const rawContentHtml =
    locale === "ko" && post.contentHtmlKo
      ? post.contentHtmlKo
      : localizedText(locale, post.contentHtml, post.contentHtmlEn, post.contentHtmlVi)
  // Content comes from admin input or AI generation, neither of which is trusted enough
  // to render as raw HTML — sanitize before it ever reaches dangerouslySetInnerHTML.
  const postContentHtml = DOMPurify.sanitize(rawContentHtml)

  return (
    <div>
      <PageHeader
        eyebrow={post.tags.join(" · ")}
        title={postTitle}
        description={`${t.webzine.writtenByPrefix}${authorLabel}${t.webzine.writtenBySuffix}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>

        {embedUrl ? (
          <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg border border-border/60">
            <iframe
              src={embedUrl}
              title={postTitle}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : directVideo ? (
          <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-black">
            <video src={directVideo} controls className="h-full w-full" />
          </div>
        ) : post.videoUrl ? (
          <a
            href={post.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-8 block text-sm text-primary underline underline-offset-4"
          >
            {t.webzine.relatedVideo}
          </a>
        ) : null}

        <div
          className="text-sm leading-relaxed text-foreground sm:text-base [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:first:mt-0 [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-4 [&_ul]:mb-4"
          dangerouslySetInnerHTML={{ __html: postContentHtml }}
        />

        <a
          href={ZENTARO_URL}
          className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/images/brand/logo.png"
              alt="ZENTARO"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <div>
              <p className="font-display text-sm font-medium">{t.webzine.ctaTitle}</p>
              <p className="text-xs text-muted-foreground">{t.webzine.ctaDescription}</p>
            </div>
          </div>
          <span className="text-sm text-primary">→</span>
        </a>
      </div>
    </div>
  )
}
