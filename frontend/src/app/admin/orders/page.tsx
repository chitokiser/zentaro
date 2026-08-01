"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchAllOrders, updateOrderStatus, type AdminOrder } from "@/lib/auth-client"

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "결제 대기",
  paid: "결제완료",
  preparing: "배송준비",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
}

const NEXT_STATUS: Record<string, string | null> = {
  paid: "preparing",
  preparing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
}

/** Tab order mirrors the real fulfillment pipeline: payment -> prep -> ship -> deliver. */
const STATUS_TABS = ["all", "pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled"] as const
type StatusTab = (typeof STATUS_TABS)[number]

const TAB_LABEL: Record<StatusTab, string> = {
  all: "전체",
  pending_payment: STATUS_LABEL.pending_payment,
  paid: STATUS_LABEL.paid,
  preparing: STATUS_LABEL.preparing,
  shipped: STATUS_LABEL.shipped,
  delivered: STATUS_LABEL.delivered,
  cancelled: STATUS_LABEL.cancelled,
}

const REFRESH_INTERVAL_MS = 30000

function formatDate(order: AdminOrder) {
  const seconds = order.createdAt?._seconds
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString("ko-KR")
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StatusTab>("all")

  const load = useCallback(() => {
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh so newly placed/paid orders show up without a manual reload.
    const interval = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 }
    for (const status of STATUS_TABS) {
      if (status === "all") continue
      c[status] = orders?.filter((o) => o.status === status).length ?? 0
    }
    return c
  }, [orders])

  const visibleOrders = useMemo(() => {
    if (!orders) return orders
    return activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab)
  }, [orders, activeTab])

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

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[tab]}
            <span
              className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                activeTab === tab ? "bg-primary-foreground/20" : "bg-secondary"
              }`}
            >
              {counts[tab] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {orders === null ? <p className="text-sm text-muted-foreground">불러오는 중...</p> : null}
        {visibleOrders?.length === 0 ? <p className="text-sm text-muted-foreground">해당 상태의 주문이 없습니다.</p> : null}
        {visibleOrders?.map((order) => (
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
                  {item.productName} x{item.quantity}
                  {item.priceZtaro != null
                    ? ` — ${item.priceZtaro.toLocaleString()} ZTARO`
                    : ` (${item.fulfillmentType}) — ${(item.priceAp ?? 0).toLocaleString()} ZP`}
                </li>
              ))}
            </ul>
            <p className="text-xs flex items-center gap-2">
              {order.paymentMethod === "ztaro" ? (
                <>
                  <Badge variant="outline" className="text-[10px]">ZTARO 결제</Badge>
                  결제: ZTARO {(order.totalPriceZtaro ?? 0).toLocaleString()}
                  {order.ztaroTxHash ? (
                    <a
                      href={`https://opbnbscan.com/tx/${order.ztaroTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      tx 보기
                    </a>
                  ) : null}
                </>
              ) : (
                <>결제: ZP {(order.totalApPaid ?? 0).toLocaleString()} + EXP {(order.totalExpPaid ?? 0).toLocaleString()}</>
              )}
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
