"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchAllPostsAdmin,
  createPost,
  deletePostAdmin,
  generateAiPost,
  type AdminPost,
} from "@/lib/auth-client"
import { WEBZINE_TAGS } from "@/lib/webzine-tags"

export default function AdminWebzinePage() {
  const [posts, setPosts] = useState<AdminPost[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiTag, setAiTag] = useState<string>("")

  const [title, setTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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
      await createPost({
        title,
        contentHtml,
        videoUrl: videoUrl.trim() || undefined,
        tags: selectedTags,
      })
      setMessage(`"${title}"을(를) 웹진에 게시했습니다.`)
      setTitle("")
      setVideoUrl("")
      setContentHtml("")
      setSelectedTags([])
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시에 실패했습니다.")
    } finally {
      setBusy(false)
    }
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
          {WEBZINE_TAGS.map((t) => (
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
        <h3 className="font-display text-base font-medium">직접 글쓰기</h3>
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          placeholder="영상 링크 (선택, YouTube 등)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <textarea
          className="min-h-48 rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-xs"
          placeholder="본문 HTML (예: <h3>소제목</h3><p>내용...</p>)"
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
        <Button type="submit" disabled={busy} className="self-start bg-primary text-primary-foreground hover:bg-primary/90">
          게시하기
        </Button>
      </form>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">게시글 ({posts?.length ?? 0})</h3>
        <div className="mt-4 flex flex-col gap-2">
          {posts?.map((post) => (
            <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
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
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === post.id}
                onClick={() => handleDelete(post.id, post.title)}
              >
                삭제
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
