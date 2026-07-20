"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { fetchSalesReport, type SalesReport } from "@/lib/auth-client"

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function AdminSalesReportPage() {
  const [startDate, setStartDate] = useState(() => toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()))
  const [report, setReport] = useState<SalesReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchSalesReport(startDate, endDate)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [startDate, endDate])

  useEffect(() => {
    load()
  }, [load])

  function downloadCsv() {
    if (!report) return
    const header = ["날짜", "유형", "주문수", "매출", "원가", "마진", "AP", "EXP"]
    const rows = report.byDateType.map((r) => [
      r.date,
      r.fulfillmentType,
      r.orderCount,
      r.totalRevenue,
      r.totalCost,
      r.totalMargin,
      r.totalApPaid,
      r.totalExpPaid,
    ])
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zentaro-sales-${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold">매출 장부</h2>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          시작일
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          종료일
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <Button variant="outline" onClick={downloadCsv} disabled={!report}>
          CSV 다운로드
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {report ? (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-card p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-xs text-muted-foreground">주문수</p>
              <p className="font-semibold">{report.totals.orderCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">매출</p>
              <p className="font-semibold">{report.totals.totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">원가</p>
              <p className="font-semibold">{report.totals.totalCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">마진</p>
              <p className="font-semibold text-primary">{report.totals.totalMargin.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AP 결제</p>
              <p className="font-semibold">{report.totals.totalApPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">EXP 결제</p>
              <p className="font-semibold">{report.totals.totalExpPaid.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">날짜</th>
                  <th className="px-3 py-2">유형</th>
                  <th className="px-3 py-2">주문수</th>
                  <th className="px-3 py-2">매출</th>
                  <th className="px-3 py-2">원가</th>
                  <th className="px-3 py-2">마진</th>
                  <th className="px-3 py-2">AP</th>
                  <th className="px-3 py-2">EXP</th>
                </tr>
              </thead>
              <tbody>
                {report.byDateType.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-muted-foreground">
                      해당 기간에 주문이 없습니다.
                    </td>
                  </tr>
                ) : null}
                {report.byDateType.map((row) => (
                  <tr key={`${row.date}-${row.fulfillmentType}`} className="border-t border-border/40">
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.fulfillmentType}</td>
                    <td className="px-3 py-2">{row.orderCount}</td>
                    <td className="px-3 py-2">{row.totalRevenue.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.totalCost.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.totalMargin.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.totalApPaid.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.totalExpPaid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}
    </div>
  )
}
