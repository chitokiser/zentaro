"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrRewardScanner } from "@/components/rewards/qr-reward-scanner"
import { RewardRoulette } from "@/components/rewards/reward-roulette"
import { useI18n } from "@/lib/i18n/i18n-context"
import {
  fetchMyBottleCapClaims,
  submitBottleCapClaim,
  type BottleCapClaim,
  redeemZtroQr,
  type ZtroRewardResult,
} from "@/lib/auth-client"

type ProductChoice = "origin" | "blue" | "other"

export default function BottleCapRewardsPage() {
  const { t } = useI18n()

  // Gates the whole page behind a login prompt — set from loadClaims()'s auth failure.
  const [error, setError] = useState<string | null>(null)

  const [claims, setClaims] = useState<BottleCapClaim[] | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimMessage, setClaimMessage] = useState<string | null>(null)
  const [claimBusy, setClaimBusy] = useState(false)
  const [productChoice, setProductChoice] = useState<ProductChoice>("origin")
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

  const CLAIM_STATUS_LABEL: Record<BottleCapClaim["status"], string> = {
    pending: t.bottleCap.statusPending,
    approved: t.bottleCap.statusApproved,
    rejected: t.bottleCap.statusRejected,
  }

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
      setClaimError(t.bottleCap.sealRequiredError)
      return
    }
    setClaimBusy(true)
    setClaimMessage(null)
    setClaimError(null)
    try {
      await submitBottleCapClaim({
        isZentaro: productChoice !== "other",
        zentaroProduct: productChoice === "blue" ? "blue" : "origin",
        brand,
        quantity,
        sealConfirmed,
        contactPhone,
        trackingNumber: trackingNumber || undefined,
        note: note || undefined,
      })
      setClaimMessage(t.bottleCap.claimSuccessMessage)
      setBrand("")
      setQuantity(1)
      setSealConfirmed(false)
      setContactPhone("")
      setTrackingNumber("")
      setNote("")
      loadClaims()
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : t.bottleCap.genericSubmitError)
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

  const brandPlaceholder =
    productChoice === "origin"
      ? t.bottleCap.brandPlaceholderOrigin
      : productChoice === "blue"
        ? t.bottleCap.brandPlaceholderBlue
        : t.bottleCap.brandPlaceholderOther

  return (
    <div>
      <PageHeader
        eyebrow={t.bottleCap.eyebrow}
        title={t.bottleCap.title}
        description={t.bottleCap.description}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {error === "로그인이 필요합니다." ? (
          <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            {t.bottleCap.loginRequired}{" "}
            <Link href="/my/profile" className="text-primary underline underline-offset-4">
              {t.bottleCap.loginCta}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <form
              onSubmit={handleClaimSubmit}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">{t.bottleCap.formTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {t.bottleCap.formDescriptionIntro} {t.bottleCap.rateOrigin} {t.bottleCap.rateBlue}
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
                  {t.bottleCap.typeLabel}
                  <select
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={productChoice}
                    onChange={(e) => setProductChoice(e.target.value as ProductChoice)}
                  >
                    <option value="origin">{t.bottleCap.typeOrigin}</option>
                    <option value="blue">{t.bottleCap.typeBlue}</option>
                    <option value="other">{t.bottleCap.typeOther}</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {t.bottleCap.brandLabel}
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                    placeholder={brandPlaceholder}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:w-28">
                  {t.bottleCap.quantityLabel}
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
                  {t.bottleCap.contactLabel}
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    minLength={5}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {t.bottleCap.trackingLabel}
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t.bottleCap.noteLabel}
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
                {t.bottleCap.sealConfirmLabel}
              </label>

              <Button
                type="submit"
                disabled={claimBusy}
                className="self-start bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t.bottleCap.submitButton}
              </Button>
            </form>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="mb-3 font-display text-base font-medium">{t.bottleCap.historyTitle}</h3>
              <div className="flex flex-col gap-2">
                {claims && claims.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t.bottleCap.historyEmpty}</p>
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
                          ? claim.rejectReason ?? t.bottleCap.rejectFallback
                          : t.bottleCap.pendingNote}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">{t.bottleCap.qrSectionTitle}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.bottleCap.qrSectionDescription}</p>

              {rewardResult ? (
                <div className="mt-4 flex flex-col items-start gap-2 rounded-md border border-primary/30 bg-secondary/40 px-4 py-3 text-sm">
                  <p className="text-primary">
                    🎉 {rewardResult.amount} ZTRO {t.bottleCap.qrCongrats}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.bottleCap.walletAddressLabel} {rewardResult.walletAddress}
                  </p>
                  <a
                    href={`https://opbnbscan.com/tx/${rewardResult.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline underline-offset-4"
                  >
                    {t.bottleCap.viewTxLink}
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
                    {t.bottleCap.scanAgainButton}
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
                    {t.bottleCap.scanButton}
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
