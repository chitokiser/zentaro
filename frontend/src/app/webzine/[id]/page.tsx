import type { Metadata } from "next"
import { getPostPreview } from "@/lib/api"
import { WebzinePostGate } from "@/components/webzine/webzine-post-gate"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const preview = await getPostPreview(id)
  if (!preview) return {}

  const title = `${preview.title} | ZENTARO 웹진`
  const description = preview.excerpt

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
  return <WebzinePostGate id={id} />
}
