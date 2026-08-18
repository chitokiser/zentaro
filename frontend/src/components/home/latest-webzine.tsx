import { getPosts } from "@/lib/api"
import { LatestWebzineList } from "@/components/home/latest-webzine-list"

const LATEST_COUNT = 10

export async function LatestWebzine() {
  const posts = await getPosts()

  return <LatestWebzineList posts={posts.slice(0, LATEST_COUNT)} />
}
