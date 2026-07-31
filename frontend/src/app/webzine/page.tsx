import { getPosts } from "@/lib/api"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"
import { WebzineList } from "@/components/webzine/webzine-list"
import { ZtaroBenefitBanner } from "@/components/ztaro-benefit-banner"

export default async function WebzinePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const posts = await getPosts(tag)

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <ZtaroBenefitBanner />
      </div>
      <WebzineList posts={posts} tags={WEBZINE_TAGS} activeTag={tag} />
    </>
  )
}
