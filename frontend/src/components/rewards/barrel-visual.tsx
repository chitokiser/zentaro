"use client"

import { cn } from "@/lib/utils"

const OAK_BARREL_IMAGE = "/images/products/Oak%20barrel.png"

const SIZE_STYLE: Record<string, { scale: number; label: string }> = {
    "5L": { scale: 0.72, label: "Light Toast" },
    "10L": { scale: 0.84, label: "Honey Charred" },
    "20L": { scale: 0.96, label: "Heavy Toast" },
    "40L": { scale: 1.08, label: "Ex-Bourbon" },
}

interface BarrelVisualProps {
    capacity: string
    progress: number // 0..1 aging progress, drives the progress bar fill
    isAging: boolean // when true, plays the glow/shimmer/bubble animation
    isDone: boolean // delivered/bottled — shown dimmed with an EMPTY tag
    className?: string
}

export function BarrelVisual({ capacity, progress, isAging, isDone, className }: BarrelVisualProps) {
    const style = SIZE_STYLE[capacity] ?? SIZE_STYLE["10L"]
    const fillPct = isDone ? 0 : Math.min(100, Math.max(4, Math.round(progress * 100)))
    const size = { width: 96 * style.scale, height: 96 * style.scale }

    return (
        <div
            className={cn("relative flex flex-col items-center gap-1.5 select-none", className)}
            title={`${capacity} · ${style.label}`}
        >
            <div
                className={cn(
                    "relative rounded-xl overflow-hidden border-2 border-amber-700/30 bg-black/10",
                    isAging && "barrel-glow-active",
                )}
                style={size}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={OAK_BARREL_IMAGE}
                    alt={`${capacity} Oak Barrel`}
                    className={cn(
                        "w-full h-full object-contain transition-all duration-700",
                        isDone && "grayscale opacity-40",
                    )}
                />

                {isAging &&
                    [0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="barrel-bubble absolute bottom-2 w-1 h-1 rounded-full bg-amber-100/80"
                            style={{ left: `${28 + i * 22}%`, animationDelay: `${i * 1.1}s` }}
                        />
                    ))}

                {isDone && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-amber-100/80 bg-black/30">
                        EMPTY
                    </div>
                )}
            </div>

            {/* Aging progress bar */}
            <div className="w-full h-1.5 rounded-full bg-black/15 overflow-hidden" style={size.width ? { width: size.width } : undefined}>
                <div
                    className={cn("h-full barrel-liquid-fill transition-[width] duration-1000 ease-out", !isAging && "opacity-50")}
                    style={{ width: `${fillPct}%` }}
                />
            </div>

            <span className="text-[9px] font-mono text-muted-foreground">{capacity}</span>
        </div>
    )
}

export function formatAgingDuration(totalSeconds: number): string {
    if (totalSeconds <= 0) return "0초"
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const parts: string[] = []
    if (days > 0) parts.push(`${days}일`)
    parts.push(`${hours}시간`, `${minutes}분`, `${seconds}초`)
    return parts.join(" ")
}

export const AGING_TARGET_SECONDS: Record<string, number> = {
    "5L": 365 * 86400,
    "10L": 545 * 86400,
    "20L": 730 * 86400,
    "40L": 1095 * 86400,
}
