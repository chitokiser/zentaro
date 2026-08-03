import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPost } from "@/lib/api"
import { getYoutubeEmbedUrl, getVimeoEmbedUrl, isDirectVideoFile } from "@/lib/video-utils"
import { WebzinePostView } from "@/components/webzine/webzine-post"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return {}

  const title = `${post.title} | ZENTARO 웹진`
  const description = post.contentHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)

  return {
    title,
    description,
    alternates: { canonical: `/webzine/${id}` },
    openGraph: { title, description },
  }
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

  const embedUrl = post.videoUrl
    ? (getYoutubeEmbedUrl(post.videoUrl) ?? getVimeoEmbedUrl(post.videoUrl))
    : null
  const directVideo = post.videoUrl && !embedUrl && isDirectVideoFile(post.videoUrl) ? post.videoUrl : null

  return <WebzinePostView post={post} embedUrl={embedUrl} directVideo={directVideo} />
}
