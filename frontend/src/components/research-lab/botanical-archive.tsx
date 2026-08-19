"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FlaskConical, Leaf, Sparkles, Beaker } from "lucide-react"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from "recharts"

interface FlavorChartPoint {
    subject: string
    A: number
    fullMark: number
}

interface Botanical {
    id: string
    nameKo: string
    nameEn: string
    scientificName: string
    flavorProfile: {
        top: string
        mid: string
        base: string
    }
    flavorChart: FlavorChartPoint[]
    extraction: string
    description: string
    relatedProduct: string
}

const botanicalData: Botanical[] = [
    {
        id: "lemongrass",
        nameKo: "레몬그라스",
        nameEn: "Lemongrass",
        scientificName: "Cymbopogon citratus",
        flavorProfile: {
            top: "강렬하고 날카로운 시트러스, 청량함",
            mid: "은은한 흙내음과 허브 터치",
            base: "옅은 스파이시",
        },
        flavorChart: [
            { subject: "Citrus", A: 95, fullMark: 100 },
            { subject: "Spicy", A: 30, fullMark: 100 },
            { subject: "Floral", A: 20, fullMark: 100 },
            { subject: "Earthy", A: 40, fullMark: 100 },
            { subject: "Sweet", A: 10, fullMark: 100 },
        ],
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "레몬그라스의 섬세한 탑노트를 살리기 위해, 끓는 주정에 직접 담그지 않고 증류기 상단의 바스켓을 통과하는 증기 주입법으로 에센셜 오일을 추출합니다.",
        relatedProduct: "젠타로 블랭크 (ZENTARO BLANC)",
    },
    {
        id: "staranise",
        nameKo: "팔각",
        nameEn: "Star Anise",
        scientificName: "Illicium verum",
        flavorProfile: {
            top: "달콤하고 화사한 아니스(Anise) 향",
            mid: "감초와 비슷한 묵직한 단맛",
            base: "따뜻하고 깊은 오리엔탈 스파이시",
        },
        flavorChart: [
            { subject: "Citrus", A: 10, fullMark: 100 },
            { subject: "Spicy", A: 85, fullMark: 100 },
            { subject: "Floral", A: 30, fullMark: 100 },
            { subject: "Earthy", A: 50, fullMark: 100 },
            { subject: "Sweet", A: 75, fullMark: 100 },
        ],
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "팔각이 가진 묵직한 뼈대와 깊은 단맛을 끌어내기 위해, 50% ABV 주정에 24시간 침출한 뒤 동증류기에 직접 넣고 끓여냅니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "cinnamon",
        nameKo: "계피",
        nameEn: "Cinnamon",
        scientificName: "Cinnamomum cassia",
        flavorProfile: {
            top: "따뜻하고 강렬한 나무껍질 향",
            mid: "달콤하고 매콤한 뉘앙스",
            base: "건조하고 우디(Woody)한 잔향",
        },
        flavorChart: [
            { subject: "Citrus", A: 5, fullMark: 100 },
            { subject: "Spicy", A: 95, fullMark: 100 },
            { subject: "Floral", A: 10, fullMark: 100 },
            { subject: "Earthy", A: 70, fullMark: 100 },
            { subject: "Sweet", A: 60, fullMark: 100 },
        ],
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "증류 후반부(Tails)에 강력한 우디함을 부여합니다. 너무 늦게 컷팅하면 쓴맛이 우러나오므로 본류(Hearts) 후반부에서의 정밀한 컷팅이 요구됩니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
]

export default function BotanicalArchive() {
    const [selected, setSelected] = useState<Botanical | null>(null)

    return (
        <div className="min-h-screen bg-slate-900 px-4 py-16 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-5 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                        <FlaskConical className="h-7 w-7 text-amber-500" />
                    </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-amber-500">ZENTARO Research Lab</p>
                <h1 className="mt-4 font-serif text-4xl font-semibold text-slate-50 sm:text-5xl">
                    Botanical &amp; Flavor Database
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                    젠타로 증류소의 비밀 실험실에서 엄선한 보태니컬 원료들의 향미 구조와 추출 비법을 기록합니다. 동증류기를
                    거쳐온 각 원료의 풍미는 카드를 눌러 자세히 탐구하실 수 있습니다.
                </p>
            </div>

            {/* Grid */}
            <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {botanicalData.map((botanical, index) => (
                    <motion.button
                        key={botanical.id}
                        type="button"
                        onClick={() => setSelected(botanical)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        whileHover={{ y: -6 }}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800 p-6 text-left shadow-lg shadow-black/20 transition-colors duration-300 hover:border-amber-500/70 hover:shadow-amber-500/10"
                    >
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 opacity-0 transition-opacity duration-300 group-hover:from-amber-500/10 group-hover:opacity-100" />

                        <div className="relative flex items-start justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                <Leaf className="h-5 w-5" />
                            </div>
                            <Sparkles className="h-4 w-4 text-slate-600 transition-colors duration-300 group-hover:text-amber-500/60" />
                        </div>

                        <h3 className="relative mt-5 font-serif text-xl font-semibold text-slate-50">{botanical.nameKo}</h3>
                        <p className="relative text-sm text-slate-400">{botanical.nameEn}</p>

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
                ))}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected ? (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-800 shadow-2xl shadow-black/50"
                        >
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-500"
                                aria-label="닫기"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Chart */}
                                <div className="flex flex-col items-center justify-center border-b border-slate-700/60 bg-slate-900/40 p-6 md:border-b-0 md:border-r">
                                    <div className="h-64 w-full sm:h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={selected.flavorChart} outerRadius="75%">
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                                                <Radar
                                                    name={selected.nameEn}
                                                    dataKey="A"
                                                    stroke="#f59e0b"
                                                    fill="#f59e0b"
                                                    fillOpacity={0.35}
                                                    strokeWidth={2}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-col p-6 sm:p-8">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-500">
                                        Botanical Archive
                                    </p>
                                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-50 sm:text-3xl">
                                        {selected.nameKo}
                                    </h2>
                                    <p className="text-sm text-slate-400">{selected.nameEn}</p>
                                    <p className="mt-1 text-xs italic text-slate-500">{selected.scientificName}</p>

                                    <div className="mt-5 space-y-3 border-t border-slate-700/60 pt-4">
                                        <div className="flex gap-3 text-sm">
                                            <span className="w-12 shrink-0 font-medium uppercase tracking-wider text-amber-500/80">
                                                Top
                                            </span>
                                            <span className="text-slate-300">{selected.flavorProfile.top}</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <span className="w-12 shrink-0 font-medium uppercase tracking-wider text-amber-500/80">
                                                Mid
                                            </span>
                                            <span className="text-slate-300">{selected.flavorProfile.mid}</span>
                                        </div>
                                        <div className="flex gap-3 text-sm">
                                            <span className="w-12 shrink-0 font-medium uppercase tracking-wider text-amber-500/80">
                                                Base
                                            </span>
                                            <span className="text-slate-300">{selected.flavorProfile.base}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-slate-700/60 pt-4">
                                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-500/80">
                                            <Beaker className="h-3.5 w-3.5" />
                                            {selected.extraction}
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{selected.description}</p>
                                    </div>

                                    <div className="mt-6">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
                                            <Sparkles className="h-3 w-3" />
                                            {selected.relatedProduct}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}
