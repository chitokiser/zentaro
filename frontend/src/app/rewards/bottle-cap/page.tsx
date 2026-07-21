"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrRewardScanner } from "@/components/rewards/qr-reward-scanner"
import { RewardRoulette } from "@/components/rewards/reward-roulette"
import {
  fetchMyBottleCapClaims,
  submitBottleCapClaim,
  type BottleCapClaim,
  redeemZtroQr,
  type ZtroRewardResult,
} from "@/lib/auth-client"

const CLAIM_STATUS_LABEL: Record<BottleCapClaim["status"], string> = {
  pending: "심사중",
  approved: "승인됨",
  rejected: "반려됨",
}

export default function BottleCapRewardsPage() {
  // Gates the whole page behind a login prompt — set from loadClaims()'s auth failure.
  const [error, setError] = useState<string | null>(null)

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

  const [scanning, setScanning] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [rewardResult, setRewardResult] = useState<ZtroRewardResult | null>(null)
  const [rewardError, setRewardError] = useState<string | null>(null)

  const loadClaims = useCallback(() => {
    fetchMyBottleCapClaims()
      .then(setClaims)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "오류가 발생했습니다."
        setClaimError(msg)
        setError(msg)
      })
  }, [])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

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
      setClaimMessage("신청이 접수되었습니다. 실물 확인 후 쇼핑머니(ZP)가 지급됩니다.")
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

  async function handleScan(code: string) {
    setScanning(false)
    setRedeeming(true)
    setRewardError(null)
    try {
      const result = await redeemZtroQr(code)
      setRewardResult(result)
    } catch (err) {
      setRewardError(err instanceof Error ? err.message : "리워드 지급에 실패했습니다.")
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="Bottle Cap Rewards"
        description="병뚜껑 리워드 — 실물 발송 신청, QR 스캔으로 ZTRO 즉시 지급"
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
            <form
              onSubmit={handleClaimSubmit}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">병뚜껑 실물 발송 신청</h3>
              <p className="text-xs text-muted-foreground">
                병뚜껑을 젠타로 본사로 발송하시면 실물 확인 후 쇼핑머니(EXP)가 지급됩니다.
                ZENTARO_ORIGIN 증류식 병뚜껑은 개당 EXP 10,000 충전됩니다.
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
                    <option value="zentaro">ZENTARO_ORIGIN 증류식</option>
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
                    placeholder={isZentaro ? "예: ZENTARO Distilled Soju" : "예: Ballantine's"}
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
                        ? `+${claim.apAmount} ZP${claim.expAmount ? ` · +${claim.expAmount} EXP` : ""}`
                        : claim.status === "rejected"
                          ? claim.rejectReason ?? "반려 사유 없음"
                          : "확인 대기중"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">QR 스캔으로 ZTRO 받기</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                관리자가 발급한 이벤트 QR을 스캔하면 무작위 수량의 ZTRO가 내 지갑으로 즉시
                지급됩니다. QR 코드는 1회만 사용할 수 있습니다.
              </p>

              {rewardResult ? (
                <div className="mt-4 flex flex-col items-start gap-2 rounded-md border border-primary/30 bg-secondary/40 px-4 py-3 text-sm">
                  <p className="text-primary">🎉 {rewardResult.amount} ZTRO 획득!</p>
                  <p className="text-xs text-muted-foreground">
                    지갑 주소: {rewardResult.walletAddress}
                  </p>
                  <a
                    href={`https://opbnbscan.com/tx/${rewardResult.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline underline-offset-4"
                  >
                    트랜잭션 확인하기
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRewardResult(null)
                      setScanning(true)
                    }}
                  >
                    다시 스캔하기
                  </Button>
                </div>
              ) : redeeming ? (
                <RewardRoulette />
              ) : scanning ? (
                <div className="mt-4">
                  <QrRewardScanner onScan={handleScan} onClose={() => setScanning(false)} />
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-start gap-2">
                  {rewardError ? (
                    <p className="w-full rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {rewardError}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => {
                      setRewardError(null)
                      setScanning(true)
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    QR 스캔하기
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
