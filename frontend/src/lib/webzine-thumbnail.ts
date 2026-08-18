import type { WebzinePost } from "@/lib/api"
import { getYoutubeThumbnail, isDirectVideoFile } from "@/lib/video-utils"

function extractThumbnail(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

export function getPostThumbnail(post: WebzinePost): { url: string; isVideoFrame: boolean } | null {
  const imgThumbnail = extractThumbnail(post.contentHtml)
  if (imgThumbnail) return { url: imgThumbnail, isVideoFrame: false }
  if (!post.videoUrl) return null
  const ytThumb = getYoutubeThumbnail(post.videoUrl)
  if (ytThumb) return { url: ytThumb, isVideoFrame: false }
  if (isDirectVideoFile(post.videoUrl)) return { url: post.videoUrl, isVideoFrame: true }
  return null
}
