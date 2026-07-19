import Image from "next/image"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { getPost } from "@/lib/api"
import { getYoutubeEmbedUrl, getVimeoEmbedUrl, isDirectVideoFile } from "@/lib/video-utils"

const ZENTARO_URL = "https://zentaro.netlify.app/"

export default async function WebzinePostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  const embedUrl = post.videoUrl
    ? (getYoutubeEmbedUrl(post.videoUrl) ?? getVimeoEmbedUrl(post.videoUrl))
    : null
  const directVideo = post.videoUrl && !embedUrl && isDirectVideoFile(post.videoUrl) ? post.videoUrl : null

  return (
    <div>
      <PageHeader
        eyebrow={post.tags.join(" · ")}
        title={post.title}
        description={`${post.source === "ai" ? "ZENTARO AI" : post.authorName} 작성`}
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>

        {embedUrl ? (
          <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg border border-border/60">
            <iframe
              src={embedUrl}
              title={post.title}
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
            관련 영상 보러가기 →
          </a>
        ) : null}

        <div
          className="text-sm leading-relaxed text-foreground sm:text-base [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:first:mt-0 [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-4 [&_ul]:mb-4"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
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
              <p className="font-display text-sm font-medium">ZENTARO 바로가기</p>
              <p className="text-xs text-muted-foreground">
                프리미엄 크래프트 증류소 ZENTARO에서 더 많은 이야기를 만나보세요
              </p>
            </div>
          </div>
          <span className="text-sm text-primary">→</span>
        </a>
      </div>
    </div>
  )
}
