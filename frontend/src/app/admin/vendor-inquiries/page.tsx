"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchVendorInquiries, updateVendorInquiryStatus, type VendorInquiry } from "@/lib/auth-client"

const STATUS_LABEL: Record<VendorInquiry["status"], string> = {
  pending: "대기",
  reviewed: "검토완료",
  contacted: "연락완료",
  rejected: "반려",
}

export default function AdminVendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<VendorInquiry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchVendorInquiries()
      .then(setInquiries)
      .catch((err) => setError(err instanceof Error ? err.message : "조회에 실패했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusChange(id: string, status: VendorInquiry["status"]) {
    setBusyId(id)
    setError(null)
    try {
      await updateVendorInquiryStatus(id, status)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold">입점 문의 ({inquiries?.length ?? 0})</h2>
        <p className="mt-2 text-sm text-muted-foreground">공급업체가 제출한 입점 문의 목록입니다.</p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {inquiries?.length === 0 ? (
          <p className="text-sm text-muted-foreground">접수된 입점 문의가 없습니다.</p>
        ) : null}
        {inquiries?.map((inquiry) => (
          <div key={inquiry.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{inquiry.productName}</span>
                <Badge variant="outline" className="text-[10px]">{inquiry.companyName}</Badge>
                <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[inquiry.status]}</Badge>
                {inquiry.sampleAvailable ? (
                  <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">샘플 제공</Badge>
                ) : null}
              </div>
              <div className="flex gap-1">
                {(["pending", "reviewed", "contacted", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={inquiry.status === status ? "default" : "ghost"}
                    disabled={busyId === inquiry.id}
                    className={inquiry.status === status ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    onClick={() => handleStatusChange(inquiry.id, status)}
                  >
                    {STATUS_LABEL[status]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span>담당자: {inquiry.contactName}</span>
              <span>이메일: {inquiry.email}</span>
              <span>연락처: {inquiry.phone}</span>
              <span>
                홈페이지:{" "}
                {inquiry.website ? (
                  <a href={inquiry.website} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                    {inquiry.website}
                  </a>
                ) : (
                  "-"
                )}
              </span>
              <span>공급단가: {inquiry.supplyPrice}</span>
              <span>최소주문량: {inquiry.minOrderQty}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
