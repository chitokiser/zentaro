import type { Metadata } from "next"
import { getPosts } from "@/lib/api"
import { CINEMA_SPIRITS_TAG } from "@/lib/webzine-tags"
import { CinemaSpiritsList } from "@/components/webzine/cinema-spirits-list"

export const metadata: Metadata = {
  title: "영화와 술 | ZENTARO 웹진",
  description: "영화 속 술 이야기와 페어링 아이디어를 만나보세요.",
  alternates: { canonical: "/webzine/cinema-spirits" },
}

export default async function CinemaSpiritsPage() {
  const posts = await getPosts(CINEMA_SPIRITS_TAG)

  return <CinemaSpiritsList posts={posts} />
}
