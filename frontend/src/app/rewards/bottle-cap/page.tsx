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
  fetchMyBottleCapClaims,
  submitBottleCapClaim,
  type BottleCapClaim,
} from "@/lib/auth-client"

const CLAIM_STATUS_LABEL: Record<BottleCapClaim["status"], string> = {
  pending: "심사중",
  approved: "승인됨",
  rejected: "반려됨",
}

export default function BottleCapRewardsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [registerCode, setRegisterCode] = useState("")
  const [transferCode, setTransferCode] = useState("")
  const [transferEmail, setTransferEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const [claims, setClaims] = useState<BottleCapClaim[] | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimMessage, setClaimMessage] = useState<string | null>(null)
  const [claimBusy, setClaimBusy] = useState(false)
  const [isZentaro, setIsZentaro] = useState(true)
  const [brand, setBrand] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [sealConfirmed, setSealConfirmed] = useState(false)
  const [contactPhone, setContactPhone] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [note, setNote] = useState("")

  const load = useCallback(() => {
    fetchMyTickets()
      .then(setTickets)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  const loadClaims = useCallback(() => {
    fetchMyBottleCapClaims()
      .then(setClaims)
      .catch((err) => setClaimError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
    loadClaims()
  }, [load, loadClaims])

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sealConfirmed) {
      setClaimError("병뚜껑에 인지세 봉인스티커 일부가 남아있음을 확인해주세요.")
      return
    }
    setClaimBusy(true)
    setClaimMessage(null)
    setClaimError(null)
    try {
      await submitBottleCapClaim({
        isZentaro,
        brand,
        quantity,
        sealConfirmed,
        contactPhone,
        trackingNumber: trackingNumber || undefined,
        note: note || undefined,
      })
      setClaimMessage("신청이 접수되었습니다. 실물 확인 후 쇼핑머니(AP)가 지급됩니다.")
      setBrand("")
      setQuantity(1)
      setSealConfirmed(false)
      setContactPhone("")
      setTrackingNumber("")
      setNote("")
      loadClaims()
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "신청에 실패했습니다.")
    } finally {
      setClaimBusy(false)
    }
  }

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
        description="병뚜껑 리워드 — 실물 발송 신청, Ticket 등록·보관·P2P 전송, 사용내역"
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
              onSubmit={handleClaimSubmit}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">병뚜껑 실물 발송 신청</h3>
              <p className="text-xs text-muted-foreground">
                병뚜껑을 젠타로 본사로 발송하시면 실물 확인 후 쇼핑머니(AP)가 지급됩니다.
                ZENTARO 자체 증류주 병뚜껑은 개당 EXP 10,000이 추가로 충전됩니다.
              </p>

              {claimMessage ? (
                <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">
                  {claimMessage}
                </p>
              ) : null}
              {claimError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {claimError}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  구분
                  <select
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={isZentaro ? "zentaro" : "other"}
                    onChange={(e) => setIsZentaro(e.target.value === "zentaro")}
                  >
                    <option value="zentaro">ZENTARO 자체 증류주</option>
                    <option value="other">기타 브랜드</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  브랜드/제품명
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                    placeholder={isZentaro ? "예: ZENTARO Dry Gin" : "예: Ballantine's"}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-28">
                  수량
                  <input
                    type="number"
                    min={1}
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  연락처
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    minLength={5}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  택배 송장번호 (선택)
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                특이사항 (선택)
                <textarea
                  className="min-h-16 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={sealConfirmed}
                  onChange={(e) => setSealConfirmed(e.target.checked)}
                  required
                />
                병뚜껑에 인지세 봉인스티커 일부가 남아있음을 확인합니다.
              </label>

              <Button
                type="submit"
                disabled={claimBusy}
                className="self-start bg-primary text-primary-foreground hover:bg-primary/90"
              >
                신청하기
              </Button>
            </form>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="mb-3 font-display text-base font-medium">발송 신청 내역</h3>
              <div className="flex flex-col gap-2">
                {claims && claims.length === 0 ? (
                  <p className="text-xs text-muted-foreground">신청 내역이 없습니다.</p>
                ) : null}
                {claims?.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col gap-1 rounded-md border border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {claim.brand} x{claim.quantity}
                      </span>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "default"
                            : claim.status === "rejected"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {CLAIM_STATUS_LABEL[claim.status]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {claim.status === "approved"
                        ? `+${claim.apAmount} AP${claim.expAmount ? ` · +${claim.expAmount} EXP` : ""}`
                        : claim.status === "rejected"
                          ? claim.rejectReason ?? "반려 사유 없음"
                          : "확인 대기중"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
