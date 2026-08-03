import type { Metadata } from "next"
import { getPosts } from "@/lib/api"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"
import { WebzineList } from "@/components/webzine/webzine-list"
import { ZtaroBenefitBanner } from "@/components/ztaro-benefit-banner"

export const metadata: Metadata = {
  title: "웹진 | ZENTARO",
  description: "ZENTARO 웹진 — 증류주, 보태니컬, 토큰 이코노미와 관련된 소식과 이야기를 만나보세요.",
  alternates: { canonical: "/webzine" },
}

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
