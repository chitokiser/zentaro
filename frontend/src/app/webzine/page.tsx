import { getPosts } from "@/lib/api"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"
import { WebzineList } from "@/components/webzine/webzine-list"

export default async function WebzinePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const posts = await getPosts(tag)

  return <WebzineList posts={posts} tags={WEBZINE_TAGS} activeTag={tag} />
}
