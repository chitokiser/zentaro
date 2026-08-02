"use client"

import { useEffect, useState } from "react"
import { fetchPancakePoolBalance } from "@/lib/auth-client"

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
    const [ztaroBalance, setZtaroBalance] = useState<number | null>(null)

    useEffect(() => {
        const fetchZtaroBalance = () => {
            fetchPancakePoolBalance()
                .then((res) => setZtaroBalance(res.balance))
                .catch(() => {})
        }
        fetchZtaroBalance()
        const intervalId = setInterval(fetchZtaroBalance, 30000)
        return () => clearInterval(intervalId)
    }, [])

    useEffect(() => {
        const fetchPoolData = async () => {
            try {
                const response = await fetch(
                    "https://api.geckoterminal.com/api/v2/networks/opbnb/pools/0x5a65805fb99cf5b7e50d567c4029af62531be53c"
                )
                const resJson = await response.json()

                if (resJson && resJson.data && resJson.data.attributes) {
                    const attr = resJson.data.attributes
                    const mapped: PoolPairData = {
                        priceUsd: attr.base_token_price_usd || "0",
                        priceNative: attr.base_token_price_native_currency || "0",
                        priceChange: {
                            h24: Number(attr.price_change_percentage?.h24 ?? 0),
                        },
                        liquidity: {
                            usd: Number(attr.reserve_in_usd ?? 0),
                        },
                        volume: {
                            h24: Number(attr.volume_usd?.h24 ?? 0),
                        },
                        fdv: Number(attr.fdv_usd ?? 0),
                    }
                    setPoolData(mapped)
                    setError(false)
                } else {
                    setError(true)
                }
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
                        Ztaro/USDT 풀 데이터 동기화 중…
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
                            Ztaro / USDT
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                            PancakeSwap V2 · opBNB
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="https://pancakeswap.finance/swap?outputCurrency=0xdd98e6425f1fc7ca536cd6bba9674f1e270cb30c&chain=opbnb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-amber-600 shadow-sm"
                    >
                        PancakeSwap에서 거래 (Buy/Sell)
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-[10px] text-emerald-500 font-medium">LIVE</span>
                    </div>
                </div>
            </div>

            <div className="border-b border-border/40 bg-amber-500/[0.06] px-5 py-2">
                <p className="text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                    ⚠ ZenTaro 수탁지갑(커스터디얼)은 베트남의 가상자산 관련 법령 및 컴플라이언스 정책을 준수하기 위해 외부 DEX와 직접 연동되지 않습니다. 공개 시장 거래는 이용자가 관련 법령을 준수하여 개인 Web3 지갑을 통해 직접 수행해야 합니다.
                </p>
            </div>

            {/* Body */}
            <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-5">
                {/* ZTARO in pool */}
                <div className="bg-card px-4 py-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        ZTARO Balance
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums">
                        {ztaroBalance === null ? "…" : ztaroBalance.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">풀 내 ZTARO 보유량</p>
                </div>

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
