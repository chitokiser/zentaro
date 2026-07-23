"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchAllPostsAdmin,
  createPost,
  updatePost,
  deletePostAdmin,
  generateAiPost,
  type AdminPost,
} from "@/lib/auth-client"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"
import { getYoutubeThumbnail, isDirectVideoFile } from "@/lib/video-utils"

function extractThumbnail(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : null
}

function getPostThumbnail(post: AdminPost): { url: string; isVideoFrame: boolean } | null {
  const imgThumbnail = extractThumbnail(post.contentHtml)
  if (imgThumbnail) return { url: imgThumbnail, isVideoFrame: false }
  if (!post.videoUrl) return null
  const ytThumb = getYoutubeThumbnail(post.videoUrl)
  if (ytThumb) return { url: ytThumb, isVideoFrame: false }
  if (isDirectVideoFile(post.videoUrl)) return { url: post.videoUrl, isVideoFrame: true }
  return null
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

export default function AdminWebzinePage() {
  const [posts, setPosts] = useState<AdminPost[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiTag, setAiTag] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [contentMode, setContentMode] = useState<"html" | "text">("html")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  // Manual EN/VI translations (optional) so the site's language switcher can show
  // this post fully translated instead of just untranslated Korean.
  const [showTranslations, setShowTranslations] = useState(false)
  const [titleKo, setTitleKo] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleVi, setTitleVi] = useState("")
  const [contentHtmlKo, setContentHtmlKo] = useState("")
  const [contentHtmlEn, setContentHtmlEn] = useState("")
  const [contentHtmlVi, setContentHtmlVi] = useState("")

  const load = useCallback(() => {
    fetchAllPostsAdmin()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedTags.length === 0) {
      setError("태그를 최소 1개 선택해주세요.")
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const finalHtml = contentMode === "text" ? textToHtml(contentHtml) : contentHtml
      const translationFields = {
        titleKo: titleKo.trim() || undefined,
        titleEn: titleEn.trim() || undefined,
        titleVi: titleVi.trim() || undefined,
        contentHtmlKo: contentHtmlKo.trim() || undefined,
        contentHtmlEn: contentHtmlEn.trim() || undefined,
        contentHtmlVi: contentHtmlVi.trim() || undefined,
      }
      if (editingId) {
        await updatePost(editingId, {
          title,
          contentHtml: finalHtml,
          videoUrl: videoUrl.trim() || undefined,
          tags: selectedTags,
          ...translationFields,
        })
        setMessage(`"${title}"을(를) 수정했습니다.`)
      } else {
        await createPost({
          title,
          contentHtml: finalHtml,
          videoUrl: videoUrl.trim() || undefined,
          tags: selectedTags,
          ...translationFields,
        })
        setMessage(`"${title}"을(를) 웹진에 게시했습니다.`)
      }
      setEditingId(null)
      setTitle("")
      setVideoUrl("")
      setContentHtml("")
      setContentMode("html")
      setSelectedTags([])
      setTitleKo("")
      setTitleEn("")
      setTitleVi("")
      setContentHtmlKo("")
      setContentHtmlEn("")
      setContentHtmlVi("")
      setShowTranslations(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  function handleEdit(post: AdminPost) {
    setEditingId(post.id)
    setTitle(post.title)
    setVideoUrl(post.videoUrl ?? "")
    setContentHtml(post.contentHtml)
    setContentMode("html")
    setSelectedTags(post.tags)
    setTitleKo(post.titleKo ?? "")
    setTitleEn(post.titleEn ?? "")
    setTitleVi(post.titleVi ?? "")
    setContentHtmlKo(post.contentHtmlKo ?? "")
    setContentHtmlEn(post.contentHtmlEn ?? "")
    setContentHtmlVi(post.contentHtmlVi ?? "")
    setShowTranslations(
      Boolean(post.titleKo || post.titleEn || post.titleVi || post.contentHtmlKo || post.contentHtmlEn || post.contentHtmlVi),
    )
    setMessage(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setTitle("")
    setVideoUrl("")
    setContentHtml("")
    setContentMode("html")
    setSelectedTags([])
    setTitleKo("")
    setTitleEn("")
    setTitleVi("")
    setContentHtmlKo("")
    setContentHtmlEn("")
    setContentHtmlVi("")
    setShowTranslations(false)
  }

  async function handleGenerateAi() {
    setAiBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await generateAiPost(aiTag || undefined)
      if (!result) {
        setError("AI 자동생성이 비활성화되어 있습니다. 서버에 ANTHROPIC_API_KEY를 설정해주세요.")
      } else {
        setMessage("AI가 새 글을 작성했습니다.")
        load()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 생성에 실패했습니다.")
    } finally {
      setAiBusy(false)
    }
  }

  async function handleCopy(post: AdminPost) {
    const text = `${post.title}\n\n${stripHtmlToText(post.contentHtml)}`
    await navigator.clipboard.writeText(text)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId((cur) => (cur === post.id ? null : cur)), 1500)
  }

  async function handleDelete(id: string, title: string) {
    setBusyId(id)
    setError(null)
    setMessage(null)
    try {
      await deletePostAdmin(id)
      setMessage(`"${title}"을(를) 삭제했습니다.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-xl font-semibold">웹진 관리</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI가 2시간마다 자동으로 글을 작성하고, 관리자도 직접 HTML/영상 링크로 글을 작성할 수 있습니다.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card p-4">
        <span className="text-sm font-medium">AI 즉시 생성</span>
        <select
          className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
          value={aiTag}
          onChange={(e) => setAiTag(e.target.value)}
        >
          <option value="">(자동 순환)</option>
          {WEBZINE_TAGS.filter((t) => t !== "🎬 젠타로 동영상").map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button size="sm" disabled={aiBusy} onClick={handleGenerateAi} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {aiBusy ? "생성 중..." : "지금 생성"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">
          {editingId ? "글 수정" : "직접 글쓰기"}
        </h3>
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="Tiêu đề (베트남어, 기본 언어)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="영상 링크 (선택, YouTube/Vimeo/mp4 등)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <div className="flex gap-1">
          <Badge
            variant={contentMode === "html" ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setContentMode("html")}
          >
            HTML
          </Badge>
          <Badge
            variant={contentMode === "text" ? "default" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => setContentMode("text")}
          >
            일반 텍스트
          </Badge>
        </div>
        <textarea
          className={contentMode === "html" ? "min-h-48 rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-xs" : "min-h-48 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"}
          placeholder={
            contentMode === "html"
              ? "본문 HTML (예: <img src=&quot;...&quot;><h3>소제목</h3><p>내용...</p>) - 썸네일은 첫 번째 img 태그입니다"
              : "본문 내용을 그냥 텍스트로 입력하세요 (줄바꿈은 자동으로 문단/줄바꿈 처리됩니다)"
          }
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          required
        />
        <div className="flex flex-wrap gap-2">
          {WEBZINE_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer text-[10px]"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Badge
          variant={showTranslations ? "default" : "outline"}
          className="cursor-pointer text-[10px] w-fit"
          onClick={() => setShowTranslations((v) => !v)}
        >
          한국어/영어 번역 {showTranslations ? "숨기기" : "입력 (선택)"}
        </Badge>
        <p className="text-[11px] text-muted-foreground">
          기본 제목/본문은 베트남어로 작성해주세요. 아래는 한국어·영어 번역(선택)입니다.
        </p>

        {showTranslations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-md border border-border/40 bg-background/40 p-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">한국어</span>
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="제목 (한국어)"
                value={titleKo}
                onChange={(e) => setTitleKo(e.target.value)}
              />
              <textarea
                className="min-h-32 rounded-md border border-border/60 bg-background px-3 py-2 text-xs"
                placeholder="본문 (한국어, HTML 또는 일반 텍스트)"
                value={contentHtmlKo}
                onChange={(e) => setContentHtmlKo(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">English</span>
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Title (English)"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
              />
              <textarea
                className="min-h-32 rounded-md border border-border/60 bg-background px-3 py-2 text-xs"
                placeholder="Content (English, HTML or plain text)"
                value={contentHtmlEn}
                onChange={(e) => setContentHtmlEn(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Tiếng Việt</span>
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="Tiêu đề (Tiếng Việt)"
                value={titleVi}
                onChange={(e) => setTitleVi(e.target.value)}
              />
              <textarea
                className="min-h-32 rounded-md border border-border/60 bg-background px-3 py-2 text-xs"
                placeholder="Nội dung (Tiếng Việt, HTML hoặc văn bản thường)"
                value={contentHtmlVi}
                onChange={(e) => setContentHtmlVi(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy} className="self-start bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "저장 중..." : editingId ? "수정 저장" : "게시하기"}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={handleCancelEdit} className="self-start">
              취소
            </Button>
          ) : null}
        </div>
      </form>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">게시글 ({posts?.length ?? 0})</h3>
        <div className="mt-4 flex flex-col gap-2">
          {posts?.map((post) => {
            const thumbnail = getPostThumbnail(post)
            return (
            <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                {thumbnail ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-black">
                    {thumbnail.isVideoFrame ? (
                      <video src={thumbnail.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <Image src={thumbnail.url} alt={post.title} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                ) : null}
                <span className="text-sm font-medium">{post.title}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {post.source === "ai" ? "AI" : "관리자"}
                </Badge>
                {post.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(post)}
                >
                  {copiedId === post.id ? "복사됨" : "복사"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === post.id}
                  onClick={() => handleEdit(post)}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === post.id}
                  onClick={() => handleDelete(post.id, post.title)}
                >
                  삭제
                </Button>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
