export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  return match ? match[1] : null
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

export function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}
