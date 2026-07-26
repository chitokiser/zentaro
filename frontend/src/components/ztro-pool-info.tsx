"use client"

import { useEffect, useState } from "react"

interface PoolPairData {
    priceUsd: string
    priceNative: string
    liquidity?: { usd?: number }
    volume?: { h24?: number }
    priceChange?: { h24?: number; h6?: number; h1?: number }
    txns?: { h24?: { buys?: number; sells?: number } }
    fdv?: number
    pairCreatedAt?: number
}

export function ZtroPoolInfo() {
    const [poolData, setPoolData] = useState<PoolPairData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchPoolData = async () => {
            try {
                const response = await fetch(
                    "https://api.dexscreener.com/latest/dex/pairs/opbnb/0xdd15A5316ED6A3530A403feDfc94FF0C6B2e64F3"
                )
                const data = await response.json()

                if (data.pair) {
                    setPoolData(data.pair)
                } else if (data.pairs && data.pairs.length > 0) {
                    setPoolData(data.pairs[0])
                }
                setError(false)
            } catch {
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchPoolData()
        const intervalId = setInterval(fetchPoolData, 10000)
        return () => clearInterval(intervalId)
    }, [])

    const priceChange24h = poolData?.priceChange?.h24 ?? 0
    const isPositive = priceChange24h >= 0

    if (loading) {
        return (
            <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-primary/60" />
                    <span className="text-sm text-muted-foreground">
                        ZTRO/USDT 풀 데이터 동기화 중…
                    </span>
                </div>
            </div>
        )
    }

    if (error || !poolData) {
        return (
            <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        📡 풀 데이터 동기화 대기 중… (최대 5~10분 소요)
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        Z
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-semibold tracking-wide">
                            ZTRO / USDT
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                            PancakeSwap V2 · opBNB
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium">LIVE</span>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4">
                {/* Price */}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Price
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums">
                        ${Number(poolData.priceUsd).toFixed(6)}
                    </p>
                    <p
                        className={`mt-0.5 text-xs font-medium tabular-nums ${isPositive ? "text-emerald-500" : "text-red-400"
                            }`}
                    >
                        {isPositive ? "▲" : "▼"} {Math.abs(priceChange24h).toFixed(2)}%
                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                            24h
                        </span>
                    </p>
                </div>

                {/* TVL */}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        TVL (Liquidity)
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums">
                        ${Number(poolData.liquidity?.usd || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                        })}
                    </p>
                </div>

                {/* 24h Volume */}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        24h Volume
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums">
                        ${Number(poolData.volume?.h24 || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                        })}
                    </p>
                </div>

                {/* 24h Txns */}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        24h Txns
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold tabular-nums">
                            {(
                                (poolData.txns?.h24?.buys ?? 0) +
                                (poolData.txns?.h24?.sells ?? 0)
                            ).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-500 tabular-nums">
                            B{poolData.txns?.h24?.buys ?? 0}
                        </span>
                        <span className="text-[10px] text-red-400 tabular-nums">
                            S{poolData.txns?.h24?.sells ?? 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
