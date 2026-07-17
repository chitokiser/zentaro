"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchMyTickets,
  registerTicket,
  transferTicket,
  useTicket,
  type Ticket,
} from "@/lib/auth-client"

export default function BottleCapRewardsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [registerCode, setRegisterCode] = useState("")
  const [transferCode, setTransferCode] = useState("")
  const [transferEmail, setTransferEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetchMyTickets()
      .then(setTickets)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await registerTicket(registerCode)
      setMessage(`Ticket ${registerCode.toUpperCase()} 등록 완료`)
      setRegisterCode("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await transferTicket(transferCode, transferEmail)
      setMessage(`Ticket ${transferCode.toUpperCase()}을(를) ${transferEmail}에게 전송 완료`)
      setTransferCode("")
      setTransferEmail("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "전송에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  async function handleUse(code: string) {
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await useTicket(code)
      setMessage(`Ticket ${code} 사용 처리 완료`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용 처리에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="Bottle Cap Rewards"
        description="병뚜껑 리워드 — Ticket 등록, 보관, P2P 전송, 사용내역"
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {error === "로그인이 필요합니다." ? (
          <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            로그인이 필요합니다.{" "}
            <Link href="/my/profile" className="text-primary underline underline-offset-4">
              로그인 하러가기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {message ? (
              <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
                {message}
              </p>
            ) : null}
            {error && error !== "로그인이 필요합니다." ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <form
              onSubmit={handleRegister}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">Ticket 등록</h3>
              <p className="text-xs text-muted-foreground">
                병뚜껑에 적힌 코드를 입력해 Ticket을 등록하세요.
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm uppercase"
                  placeholder="예: A1B2C3D4E5"
                  value={registerCode}
                  onChange={(e) => setRegisterCode(e.target.value)}
                  required
                />
                <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  등록
                </Button>
              </div>
            </form>

            <form
              onSubmit={handleTransfer}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">Ticket P2P 전송</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm uppercase"
                  placeholder="Ticket 코드"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  required
                />
                <input
                  className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                  type="email"
                  placeholder="받는 사람 이메일"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={busy} variant="outline">
                  전송
                </Button>
              </div>
            </form>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">보유 Ticket / 사용내역</h3>
              <div className="mt-4 flex flex-col gap-2">
                {tickets && tickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">보유한 Ticket이 없습니다.</p>
                ) : null}
                {tickets?.map((ticket) => (
                  <div
                    key={ticket.code}
                    className="flex items-center justify-between rounded-md border border-border/40 px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{ticket.code}</span>
                      <Badge variant={ticket.status === "used" ? "secondary" : "outline"} className="text-[10px]">
                        {ticket.status === "used" ? "사용됨" : "미사용"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ticket.source}</span>
                    </div>
                    {ticket.status === "unused" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => handleUse(ticket.code)}
                      >
                        사용하기
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
