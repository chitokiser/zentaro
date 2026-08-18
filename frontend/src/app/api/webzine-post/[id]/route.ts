import { NextRequest, NextResponse } from "next/server"
import { sanitizePostHtml } from "@/lib/sanitize-post-html"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

/**
 * Relays the member-gated GET /posts/:id backend route and sanitizes the HTML
 * server-side (see sanitize-post-html.ts — sanitize-html must stay server-only,
 * so it can't run in the "use client" post-detail component that calls this).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const authorization = req.headers.get("authorization")

  const res = await fetch(`${API_URL}/posts/${id}`, {
    headers: authorization ? { authorization } : {},
    cache: "no-store",
  })

  if (res.status === 401) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const post = await res.json()
  return NextResponse.json({
    ...post,
    contentHtml: sanitizePostHtml(post.contentHtml),
    contentHtmlKo: post.contentHtmlKo ? sanitizePostHtml(post.contentHtmlKo) : post.contentHtmlKo,
    contentHtmlEn: post.contentHtmlEn ? sanitizePostHtml(post.contentHtmlEn) : post.contentHtmlEn,
    contentHtmlVi: post.contentHtmlVi ? sanitizePostHtml(post.contentHtmlVi) : post.contentHtmlVi,
  })
}
