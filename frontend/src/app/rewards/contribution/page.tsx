"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchMyContributions,
  submitContribution,
  type Contribution,
} from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"

const ITEM_TYPES = ["oak_barrel", "brandy", "whisky", "gin", "rum", "other"] as const

export default function ContributionPage() {
  const { t } = useI18n()
  const c = t.contribution
  const itemLabels: Record<(typeof ITEM_TYPES)[number], string> = {
    oak_barrel: c.itemLabels.oakBarrel,
    brandy: c.itemLabels.brandy,
    whisky: c.itemLabels.whisky,
    gin: c.itemLabels.gin,
    rum: c.itemLabels.rum,
    other: c.itemLabels.other,
  }
  const statusLabel: Record<Contribution["status"], string> = {
    pending: c.statusPending,
    approved: c.statusApproved,
    rejected: c.statusRejected,
  }

  const [items, setItems] = useState<Contribution[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [itemType, setItemType] = useState<(typeof ITEM_TYPES)[number]>("oak_barrel")
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")

  const load = useCallback(() => {
    fetchMyContributions()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : c.genericError))
  }, [c.genericError])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await submitContribution({ itemType, quantity, description, contactPhone, address })
      setMessage(c.submitSuccess)
      setQuantity(1)
      setDescription("")
      setContactPhone("")
      setAddress("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : c.submitError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={<>{c.descriptionPrefix}<span className="notranslate">EXP</span>{c.descriptionSuffix}</>}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {error === "로그인이 필요합니다." ? (
          <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            {c.loginRequired}{" "}
            <Link href="/my/profile" className="text-primary underline underline-offset-4">
              {c.loginCta}
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
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">{c.formTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {c.formDescriptionPrefix}<span className="notranslate">EXP</span>{c.formDescriptionSuffix}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {c.itemTypeLabel}
                  <select
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as typeof itemType)}
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {itemLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {c.quantityLabel}
                  <input
                    type="number"
                    min={1}
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {c.descriptionLabel}
                <textarea
                  className="min-h-24 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={5}
                />
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {c.contactLabel}
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    minLength={5}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {c.addressLabel}
                  <input
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="self-start bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {c.submitButton}
              </Button>
            </form>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">{c.historyTitle}</h3>
              <div className="mt-4 flex flex-col gap-2">
                {items && items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{c.historyEmpty}</p>
                ) : null}
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {itemLabels[item.itemType as (typeof ITEM_TYPES)[number]] ?? item.itemType} x{item.quantity}
                      </span>
                      <Badge
                        variant={
                          item.status === "approved"
                            ? "default"
                            : item.status === "rejected"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {statusLabel[item.status]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.status === "approved"
                        ? `+${item.apAmount}${c.approvedAmountSuffix}`
                        : item.status === "rejected"
                          ? item.rejectReason ?? c.rejectFallback
                          : c.pendingNote}
                    </span>
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
