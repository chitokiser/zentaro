"use client"

import { useMemo, useRef, useState } from "react"

export interface PriceTrendPoint {
  dt: string
  value: number
}

const WIDTH = 640
const HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 48 }

function formatMonth(dt: string) {
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return dt
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
}

/** Single-series monthly line chart (price or volume trend). No fabricated interpolation — points are plotted exactly as given, gaps are simply not drawn between non-adjacent months. */
export function PriceTrendChart({
  points,
  valueLabel,
  valuePrefix = "",
  valueSuffix = "",
}: {
  points: PriceTrendPoint[]
  valueLabel: string
  valuePrefix?: string
  valueSuffix?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { path, coords, minV, maxV } = useMemo(() => {
    if (points.length === 0) return { path: "", coords: [] as { x: number; y: number }[], minV: 0, maxV: 0 }
    const values = points.map((p) => p.value)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const span = maxV - minV || 1
    const innerW = WIDTH - PADDING.left - PADDING.right
    const innerH = HEIGHT - PADDING.top - PADDING.bottom
    const coords = points.map((p, i) => ({
      x: PADDING.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
      y: PADDING.top + innerH - ((p.value - minV) / span) * innerH,
    }))
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")
    return { path, coords, minV, maxV }
  }, [points])

  if (points.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
  }

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const local = pt.matrixTransform(ctm.inverse())
    let nearest = 0
    let nearestDist = Infinity
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - local.x)
      if (d < nearestDist) {
        nearestDist = d
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const hoveredCoord = hoverIndex != null ? coords[hoverIndex] : null
  const gridLines = [minV, (minV + maxV) / 2, maxV]

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((v, i) => {
          const innerH = HEIGHT - PADDING.top - PADDING.bottom
          const span = maxV - minV || 1
          const y = PADDING.top + innerH - ((v - minV) / span) * innerH
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={4} y={y + 4} fontSize={10} fill="var(--muted-foreground)">
                {valuePrefix}
                {Math.round(v).toLocaleString()}
              </text>
            </g>
          )
        })}

        <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {coords.length === 1 ? (
          <circle cx={coords[0].x} cy={coords[0].y} r={4} fill="var(--primary)" />
        ) : null}

        {hoveredCoord ? (
          <>
            <line
              x1={hoveredCoord.x}
              x2={hoveredCoord.x}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={hoveredCoord.x} cy={hoveredCoord.y} r={4} fill="var(--primary)" />
          </>
        ) : null}

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="var(--muted-foreground)">
          {formatMonth(points[0].dt)}
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill="var(--muted-foreground)" textAnchor="end">
          {formatMonth(points[points.length - 1].dt)}
        </text>
      </svg>

      {hovered ? (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-xs shadow-sm">
          <p className="text-muted-foreground">{formatMonth(hovered.dt)}</p>
          <p className="font-medium text-foreground">
            {valueLabel}: {valuePrefix}
            {hovered.value.toLocaleString()}
            {valueSuffix}
          </p>
        </div>
      ) : null}
    </div>
  )
}
