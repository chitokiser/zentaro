"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchMyContributions,
  submitContribution,
  CONTRIBUTION_ITEM_LABELS,
  type Contribution,
} from "@/lib/auth-client"

const ITEM_TYPES = ["oak_barrel", "brandy", "whisky", "gin", "rum", "other"] as const

const STATUS_LABEL: Record<Contribution["status"], string> = {
  pending: "심사중",
  approved: "승인됨",
  rejected: "반려됨",
}

export default function ContributionPage() {
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
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

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
      setMessage("신청이 접수되었습니다. 검수 후 쇼핑머니(ZP)가 지급됩니다.")
      setQuantity(1)
      setDescription("")
      setContactPhone("")
      setAddress("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="현물출자"
        description="집에 있는 오크통·브랜디·위스키·진·럼을 보내주시면 검수 후 쇼핑머니(ZP)를 드립니다."
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
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5"
            >
              <h3 className="font-display text-base font-medium">현물출자 신청</h3>
              <p className="text-xs text-muted-foreground">
                신청 후 담당자가 실물을 검수하여 ZP(쇼핑머니) 지급액을 결정합니다.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  품목
                  <select
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as typeof itemType)}
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {CONTRIBUTION_ITEM_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
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

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                상세 설명 (용량, 숙성연수, 상태 등)
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
                  수거 주소 (선택)
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
                신청하기
              </Button>
            </form>

            <div className="rounded-lg border border-border/60 bg-card p-5">
              <h3 className="font-display text-base font-medium">신청 내역</h3>
              <div className="mt-4 flex flex-col gap-2">
                {items && items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">신청 내역이 없습니다.</p>
                ) : null}
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {CONTRIBUTION_ITEM_LABELS[item.itemType] ?? item.itemType} x{item.quantity}
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
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.status === "approved"
                        ? `+${item.apAmount} ZP 지급`
                        : item.status === "rejected"
                          ? item.rejectReason ?? "반려 사유 없음"
                          : "검수 대기중"}
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
