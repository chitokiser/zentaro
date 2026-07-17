"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getToken } from "@/lib/auth-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export default function AdminTicketsPage() {
  const [count, setCount] = useState(10)
  const [source, setSource] = useState("bottle_cap")
  const [codes, setCodes] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setCodes(null)
    try {
      const token = getToken()
      if (!token) throw new Error("로그인이 필요합니다.")
      const res = await fetch(`${API_URL}/tickets/issue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count, source }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? "발급에 실패했습니다.")
      }
      const data = await res.json()
      setCodes(data.codes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">Ticket 발급</h2>
      <p className="text-sm text-muted-foreground">
        관리자 계정(isAdmin=true)으로 로그인 후 병뚜껑 Ticket 코드를 대량 발급합니다.
      </p>

      <form
        onSubmit={handleIssue}
        className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
          발급 수량
          <input
            type="number"
            min={1}
            max={500}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
          발급 출처(source)
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
          발급
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {codes ? (
        <div className="rounded-lg border border-border/60 bg-card p-5">
          <h3 className="mb-3 text-sm font-medium">발급된 코드 {codes.length}개</h3>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
            {codes.map((code) => (
              <span key={code} className="rounded bg-secondary/60 px-2 py-1">
                {code}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
