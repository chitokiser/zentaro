"use client"

import type { MouseEvent } from "react"
import { motion } from "framer-motion"
import { Leaf, Sparkles, Beaker, Check, Lock } from "lucide-react"
import { useWikipediaThumbnail } from "@/lib/wikipedia-thumbnail"
import type { Botanical } from "@/components/research-lab/botanical-archive"

interface BotanicalCardProps {
    botanical: Botanical
    index: number
    isMixed: boolean
    loggedIn: boolean
    onSelect: (botanical: Botanical) => void
    onToggleMix: (id: string, e: MouseEvent) => void
}

export function BotanicalCard({ botanical, index, isMixed, loggedIn, onSelect, onToggleMix }: BotanicalCardProps) {
    const { thumbnail, pageUrl, ref } = useWikipediaThumbnail(botanical.scientificName)

    function openWikipedia(e: MouseEvent) {
        if (!pageUrl) return
        e.stopPropagation()
        window.open(pageUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <motion.button
            type="button"
            onClick={() => onSelect(botanical)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.05 }}
            whileHover={{ y: -6 }}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 text-left shadow-lg shadow-black/20 transition-colors duration-300 ${
                isMixed
                    ? "border-amber-500 bg-slate-800 ring-2 ring-amber-500/40"
                    : "border-slate-700/60 bg-slate-800 hover:border-amber-500/70 hover:shadow-amber-500/10"
            }`}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 opacity-0 transition-opacity duration-300 group-hover:from-amber-500/10 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
                <span
                    ref={ref}
                    role={pageUrl ? "link" : undefined}
                    tabIndex={pageUrl ? 0 : undefined}
                    onClick={openWikipedia}
                    onKeyDown={(e) => {
                        if (pageUrl && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            openWikipedia(e as unknown as MouseEvent)
                        }
                    }}
                    title={pageUrl ? "Wikipedia에서 보기" : undefined}
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-500/10 text-amber-500"
                >
                    {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external Wikimedia URL, not a local/optimizable asset
                        <img src={thumbnail} alt={botanical.nameEn} className="h-full w-full object-cover" />
                    ) : (
                        <Leaf className="h-5 w-5" />
                    )}
                </span>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-600 transition-colors duration-300 group-hover:text-amber-500/60" />
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => onToggleMix(botanical.id, e)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                onToggleMix(botanical.id, e as unknown as MouseEvent)
                            }
                        }}
                        aria-label={!loggedIn ? "믹스는 회원 전용 기능입니다" : isMixed ? "믹스에서 제외" : "믹스에 추가"}
                        aria-pressed={isMixed}
                        title={!loggedIn ? "로그인 후 이용 가능합니다" : undefined}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isMixed
                                ? "border-amber-500 bg-amber-500 text-slate-950"
                                : loggedIn
                                  ? "border-slate-600 text-transparent hover:border-amber-500/60"
                                  : "border-slate-700 text-slate-600"
                        }`}
                    >
                        {isMixed ? <Check className="h-3.5 w-3.5" /> : !loggedIn ? <Lock className="h-3 w-3" /> : <Check className="h-3.5 w-3.5" />}
                    </span>
                </div>
            </div>

            <h3 className="relative mt-5 font-serif text-xl font-semibold text-slate-50">{botanical.nameEn}</h3>
            <p className="relative text-sm italic text-slate-400">{botanical.scientificName}</p>
            <p className="relative mt-0.5 text-xs text-slate-500">{botanical.nameKo}</p>

            <div className="relative mt-5 space-y-2 border-t border-slate-700/60 pt-4 text-xs">
                <div>
                    <span className="font-medium uppercase tracking-wider text-amber-500/80">Top</span>
                    <p className="mt-0.5 text-slate-400">{botanical.flavorProfile.top}</p>
                </div>
                <div>
                    <span className="font-medium uppercase tracking-wider text-amber-500/80">Mid</span>
                    <p className="mt-0.5 text-slate-400">{botanical.flavorProfile.mid}</p>
                </div>
                <div>
                    <span className="font-medium uppercase tracking-wider text-amber-500/80">Base</span>
                    <p className="mt-0.5 text-slate-400">{botanical.flavorProfile.base}</p>
                </div>
            </div>

            <div className="relative mt-5 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
                <Beaker className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{botanical.extraction}</span>
            </div>
        </motion.button>
    )
}
