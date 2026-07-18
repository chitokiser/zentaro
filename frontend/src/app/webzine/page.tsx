import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { getPosts } from "@/lib/api"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export default async function WebzinePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams
  const posts = await getPosts(tag)

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="ZENTARO 웹진"
        description="증류주, 허브, 미식에 관한 이야기 — AI가 2시간마다 자동으로, 관리자가 직접 작성합니다."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/webzine">
            <Badge variant={!tag ? "default" : "outline"} className="cursor-pointer">
              전체
            </Badge>
          </Link>
          {WEBZINE_TAGS.map((t) => (
            <Link key={t} href={`/webzine?tag=${encodeURIComponent(t)}`}>
              <Badge variant={tag === t ? "default" : "outline"} className="cursor-pointer">
                {t}
              </Badge>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 글이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/webzine/${post.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/60"
              >
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-[10px]">
                    {post.source === "ai" ? "AI" : "관리자"}
                  </Badge>
                </div>
                <h3 className="font-display text-base font-medium">{post.title}</h3>
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {stripHtml(post.contentHtml)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
