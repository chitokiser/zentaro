"use client"

import { cn } from "@/lib/utils"

const OAK_BARREL_IMAGE = "/images/products/oak/Oak%20barrel.png"

const SIZE_STYLE: Record<string, { scale: number; label: string }> = {
    "5L": { scale: 0.72, label: "Light Toast" },
    "10L": { scale: 0.84, label: "Honey Charred" },
    "20L": { scale: 0.96, label: "Heavy Toast" },
    "40L": { scale: 1.08, label: "Ex-Bourbon" },
}

// New-make spirit is pale straw; fully aged spirit has drawn deep amber/mahogany
// color out of the oak — particles shift along this gradient as progress climbs.
const PARTICLE_START = { r: 250, g: 240, b: 210 }
const PARTICLE_END = { r: 120, g: 55, b: 20 }
const MIN_PARTICLES = 2
const MAX_PARTICLES = 8

function particleColor(progress: number): string {
    const t = Math.min(1, Math.max(0, progress))
    const r = Math.round(PARTICLE_START.r + (PARTICLE_END.r - PARTICLE_START.r) * t)
    const g = Math.round(PARTICLE_START.g + (PARTICLE_END.g - PARTICLE_START.g) * t)
    const b = Math.round(PARTICLE_START.b + (PARTICLE_END.b - PARTICLE_START.b) * t)
    return `rgb(${r}, ${g}, ${b})`
}

interface BarrelVisualProps {
    capacity: string
    progress: number // 0..1 aging progress, drives the progress bar + particle color/count
    isAging: boolean // when true, plays the glow/particle animation
    isDone: boolean // delivered/bottled — shown dimmed with an EMPTY tag
    className?: string
}

export function BarrelVisual({ capacity, progress, isAging, isDone, className }: BarrelVisualProps) {
    const style = SIZE_STYLE[capacity] ?? SIZE_STYLE["10L"]
    const clampedProgress = Math.min(1, Math.max(0, progress))
    const fillPct = isDone ? 0 : Math.min(100, Math.max(4, Math.round(clampedProgress * 100)))
    const size = { width: 96 * style.scale, height: 96 * style.scale }
    const particleCount = Math.round(MIN_PARTICLES + (MAX_PARTICLES - MIN_PARTICLES) * clampedProgress)
    const color = particleColor(clampedProgress)

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
                    Array.from({ length: particleCount }).map((_, i) => (
                        <span
                            key={i}
                            className="barrel-bubble absolute bottom-2 rounded-full transition-colors duration-1000"
                            style={{
                                left: `${12 + ((i * 76) / Math.max(1, particleCount - 1 || 1))}%`,
                                width: 4 + (i % 2),
                                height: 4 + (i % 2),
                                backgroundColor: color,
                                animationDelay: `${(i % 4) * 0.8}s`,
                            }}
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
