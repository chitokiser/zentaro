"use client"

import { useState } from "react"

export function ZtroChartWidget() {
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <div className="flex items-center gap-2">
                    <svg
                        className="h-4 w-4 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <h3 className="font-display text-sm font-semibold tracking-wide">
                        Ztaro/USDT Live Chart
                    </h3>
                </div>
                <a
                    href="https://www.geckoterminal.com/opbnb/pools/0x5a65805fb99cf5b7e50d567c4029af62531be53c"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                    GeckoTerminal에서 보기
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </a>
            </div>

            {/* Chart iframe */}
            <div className="relative" style={{ height: "480px" }}>
                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        <span className="text-xs text-muted-foreground">
                            차트 로딩 중…
                        </span>
                    </div>
                )}
                <iframe
                    title="Ztaro/USDT Chart"
                    src="https://www.geckoterminal.com/opbnb/pools/0x5a65805fb99cf5b7e50d567c4029af62531be53c?embed=1&info=0&swaps=0"
                    style={{ width: "100%", height: "100%", border: "none" }}
                    onLoad={() => setIsLoaded(true)}
                    allowFullScreen
                />
            </div>
        </div>
    )
}
