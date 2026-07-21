"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchAllOrders, updateOrderStatus, type AdminOrder } from "@/lib/auth-client"

const STATUS_LABEL: Record<string, string> = {
  paid: "결제완료",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
}

const NEXT_STATUS: Record<string, string | null> = {
  paid: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
}

function formatDate(order: AdminOrder) {
  const seconds = order.createdAt?._seconds
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString("ko-KR")
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdvance(order: AdminOrder) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setBusy(order.id)
    setError(null)
    try {
      await updateOrderStatus(order.id, next)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  async function handleCancel(order: AdminOrder) {
    setBusy(order.id)
    setError(null)
    try {
      await updateOrderStatus(order.id, "cancelled")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소에 실패했습니다.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">주문 관리</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3">
        {orders === null ? <p className="text-sm text-muted-foreground">불러오는 중...</p> : null}
        {orders?.length === 0 ? <p className="text-sm text-muted-foreground">주문이 없습니다.</p> : null}
        {orders?.map((order) => (
          <div key={order.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">주문 #{order.id.slice(0, 8)}</span>
              <Badge variant={order.status === "cancelled" ? "secondary" : "default"} className="text-[10px]">
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(order)}</p>
            <ul className="text-xs text-muted-foreground">
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.productName} x{item.quantity} ({item.fulfillmentType}) — {item.priceAp.toLocaleString()} ZP
                </li>
              ))}
            </ul>
            <p className="text-xs">
              결제: ZP {order.totalApPaid.toLocaleString()} + EXP {order.totalExpPaid.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              배송지: {order.shippingAddress?.recipientName} / {order.shippingAddress?.phone} / (
              {order.shippingAddress?.postalCode}) {order.shippingAddress?.addressLine1}{" "}
              {order.shippingAddress?.addressLine2 ?? ""}
              {order.shippingAddress?.deliveryMemo ? ` · 메모: ${order.shippingAddress.deliveryMemo}` : ""}
            </p>
            <div className="flex gap-2">
              {NEXT_STATUS[order.status] ? (
                <Button
                  size="sm"
                  disabled={busy === order.id}
                  onClick={() => handleAdvance(order)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {STATUS_LABEL[NEXT_STATUS[order.status]!]}(으)로 변경
                </Button>
              ) : null}
              {order.status !== "cancelled" && order.status !== "delivered" ? (
                <Button size="sm" variant="ghost" disabled={busy === order.id} onClick={() => handleCancel(order)}>
                  주문 취소
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
