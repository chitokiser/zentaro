import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { getPost } from "@/lib/api"

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

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

  const embedUrl = post.videoUrl ? getYoutubeEmbedUrl(post.videoUrl) : null

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
          <Badge variant="secondary" className="text-[10px]">
            {post.source === "ai" ? "AI 자동작성" : "관리자 작성"}
          </Badge>
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
      </div>
    </div>
  )
}
