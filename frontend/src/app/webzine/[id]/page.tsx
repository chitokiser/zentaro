import { notFound } from "next/navigation"
import { getPost } from "@/lib/api"
import { getYoutubeEmbedUrl, getVimeoEmbedUrl, isDirectVideoFile } from "@/lib/video-utils"
import { WebzinePostView } from "@/components/webzine/webzine-post"

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
