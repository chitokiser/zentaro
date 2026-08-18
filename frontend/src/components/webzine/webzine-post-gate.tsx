"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Lock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"
import { getToken, onAuthChanged, fetchWebzinePostDetail } from "@/lib/auth-client"
import type { WebzinePost } from "@/lib/api"
import { getYoutubeEmbedUrl, getVimeoEmbedUrl, isDirectVideoFile } from "@/lib/video-utils"
import { WebzinePostView } from "@/components/webzine/webzine-post"

export function WebzinePostGate({ id }: { id: string }) {
  const { t } = useI18n()
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
  const [post, setPost] = useState<WebzinePost | null>(null)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => onAuthChanged(() => setLoggedIn(Boolean(getToken()))), [])

  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    fetchWebzinePostDetail(id).then((result) => {
      if (cancelled) return
      if (result.status === "ok") setPost(result.post)
      else if (result.status === "not_found") setNotFoundFlag(true)
    })
    return () => {
      cancelled = true
    }
  }, [id, loggedIn])

  if (!loggedIn) {
    return (
      <div>
        <PageHeader eyebrow={t.webzine.eyebrow} title={t.webzine.memberOnlyTitle} icon={<Lock className="h-8 w-8 text-primary" />} />
        <div className="mx-auto max-w-md px-4 py-14 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">{t.webzine.memberOnlyDescription}</p>
          <Link
            href={`/my/profile?next=${encodeURIComponent(`/webzine/${id}`)}`}
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t.webzine.loginCta}
          </Link>
        </div>
      </div>
    )
  }

  if (notFoundFlag) {
    notFound()
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">...</p>
      </div>
    )
  }

  const embedUrl = post.videoUrl ? (getYoutubeEmbedUrl(post.videoUrl) ?? getVimeoEmbedUrl(post.videoUrl)) : null
  const directVideo = post.videoUrl && !embedUrl && isDirectVideoFile(post.videoUrl) ? post.videoUrl : null

  return <WebzinePostView post={post} embedUrl={embedUrl} directVideo={directVideo} />
}
