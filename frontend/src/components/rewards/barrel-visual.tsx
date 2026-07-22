"use client"

import { cn } from "@/lib/utils"

const SIZE_STYLE: Record<string, { scale: number; wood: string; hoop: string; label: string }> = {
    "5L": { scale: 0.72, wood: "#c8a26a", hoop: "#8a6a3e", label: "Light Toast" },
    "10L": { scale: 0.84, wood: "#b98a52", hoop: "#7a5a34", label: "Honey Charred" },
    "20L": { scale: 0.96, wood: "#9c6f3f", hoop: "#5f4526", label: "Heavy Toast" },
    "40L": { scale: 1.08, wood: "#7d5631", hoop: "#4a3319", label: "Ex-Bourbon" },
}

interface BarrelVisualProps {
    capacity: string
    progress: number // 0..1 aging progress, drives liquid fill height
    isAging: boolean // when true, plays the shimmer/glow/bubble animation
    isDone: boolean // delivered/bottled — shown as sealed/empty
    className?: string
}

export function BarrelVisual({ capacity, progress, isAging, isDone, className }: BarrelVisualProps) {
    const style = SIZE_STYLE[capacity] ?? SIZE_STYLE["10L"]
    const fillPct = isDone ? 0 : Math.min(100, Math.max(6, Math.round(progress * 100)))

    return (
        <div
            className={cn("relative flex flex-col items-center justify-end select-none", className)}
            style={{ width: 96 * style.scale, height: 108 * style.scale }}
            title={`${capacity} · ${style.label}`}
        >
            <div
                className="relative w-full h-full rounded-[38%/22%] overflow-hidden border-2"
                style={{
                    borderColor: style.hoop,
                    background: `linear-gradient(180deg, ${style.wood} 0%, ${style.wood}dd 55%, ${style.wood}bb 100%)`,
                }}
            >
                {/* Hoops (top / mid / bottom bands) */}
                <div className="absolute left-0 right-0 top-[14%] h-[7%]" style={{ background: style.hoop, opacity: 0.85 }} />
                <div className="absolute left-0 right-0 top-[47%] h-[6%]" style={{ background: style.hoop, opacity: 0.7 }} />
                <div className="absolute left-0 right-0 bottom-[14%] h-[7%]" style={{ background: style.hoop, opacity: 0.85 }} />

                {/* Wood stave lines */}
                <div
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 10px)",
                    }}
                />

                {/* Liquid fill, height = aging progress */}
                {!isDone && (
                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 barrel-liquid-fill transition-[height] duration-1000 ease-out",
                            isAging && "barrel-glow-active",
                        )}
                        style={{ height: `${fillPct}%` }}
                    >
                        {isAging &&
                            [0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className="barrel-bubble absolute bottom-1 w-1 h-1 rounded-full bg-amber-100/70"
                                    style={{ left: `${20 + i * 28}%`, animationDelay: `${i * 1.1}s` }}
                                />
                            ))}
                    </div>
                )}

                {isDone && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-amber-100/70 bg-black/20">
                        EMPTY
                    </div>
                )}
            </div>

            <span className="mt-1.5 text-[9px] font-mono text-muted-foreground">{capacity}</span>
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
