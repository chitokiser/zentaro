import { BotanicalDetailContent } from "@/components/drinks/botanical-detail-content"

export default async function BotanicalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BotanicalDetailContent slug={slug} />
}
