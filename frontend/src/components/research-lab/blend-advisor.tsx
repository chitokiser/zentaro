"use client"

import { useState } from "react"
import { MessageSquare, Sparkles, RotateCcw } from "lucide-react"
import { MemberFeatureLock } from "@/components/research-lab/member-feature-lock"
import type { Botanical } from "@/components/research-lab/botanical-archive"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"

const SUBJECTS = ["Citrus", "Spicy", "Floral", "Earthy", "Sweet"] as const
const NEGATION_RE = /없다|없어|없음|없고|없는|제외|빼고|말고|안\s*가지|안\s*갖고|보유.{0,4}않/

function normalize(text: string): string {
    return text.replace(/[\s,.\/·"'!?()~\-]+/g, "")
}

function extractKeywords(botanical: Botanical): string[] {
    const words = new Set<string>()
    const full = normalize(botanical.nameKo)
    if (full.length >= 2) words.add(full)
    for (const token of botanical.nameKo.split(/\s+/)) {
        const normalized = normalize(token)
        if (normalized.length >= 2) words.add(normalized)
    }
    const fullEn = normalize(botanical.nameEn.toLowerCase())
    if (fullEn.length >= 3) words.add(fullEn)
    return [...words]
}

interface ParsedIngredient {
    botanical: Botanical
    excluded: boolean
}

/** Splits the query into sentence-ish clauses, matches known botanicals by
 * name within each clause, and flags a clause's matches as excluded when the
 * clause contains a negation cue (e.g. "오미자는 없다"). Simple and
 * explainable rather than a full NLP parse — the UI lets the user correct
 * any mis-read ingredient by toggling its chip. */
function parseIngredientQuery(query: string, botanicals: Botanical[]): ParsedIngredient[] {
    const clauses = query.split(/[.!?\n]+/).filter((clause) => clause.trim().length > 0)
    const decisions = new Map<string, boolean>()
    for (const clause of clauses) {
        const flat = normalize(clause)
        const excluded = NEGATION_RE.test(clause)
        for (const botanical of botanicals) {
            if (extractKeywords(botanical).some((keyword) => flat.includes(keyword))) {
                decisions.set(botanical.id, excluded)
            }
        }
    }
    return botanicals
        .filter((botanical) => decisions.has(botanical.id))
        .map((botanical) => ({ botanical, excluded: decisions.get(botanical.id) as boolean }))
}

function intensity(botanical: Botanical): number {
    const values = botanical.flavorChart.map((point) => point.A)
    return values.reduce((sum, v) => sum + v, 0) / values.length
}

interface Ratio {
    botanical: Botanical
    percent: number
}

/** Weights each ingredient inversely to its overall flavor intensity, so a
 * dominant botanical gets a smaller share and a mild one gets a larger
 * share — a simple, explainable way to keep any single note from
 * overpowering the blend. Clamped to a sane per-ingredient range, then
 * rounded so the shares sum to exactly 100. */
function computeBalancedRatios(selection: Botanical[]): Ratio[] {
    if (selection.length === 0) return []
    const MIN_PCT = 6
    const MAX_PCT = 32
    const weights = selection.map((b) => 1 / Math.max(intensity(b), 5))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const clamped = weights.map((w) => Math.min(MAX_PCT, Math.max(MIN_PCT, (w / totalWeight) * 100)))
    const clampedTotal = clamped.reduce((sum, p) => sum + p, 0)
    const percents = clamped.map((p) => Math.round((p / clampedTotal) * 100))
    const diff = 100 - percents.reduce((sum, p) => sum + p, 0)
    percents[0] += diff
    return selection.map((botanical, i) => ({ botanical, percent: percents[i] }))
}

function computeWeightedChart(ratios: Ratio[]) {
    return SUBJECTS.map((subject) => {
        const value = ratios.reduce((sum, r) => {
            const axisValue = r.botanical.flavorChart.find((point) => point.subject === subject)?.A ?? 0
            return sum + axisValue * (r.percent / 100)
        }, 0)
        return { subject, A: Math.round(value), fullMark: 100 }
    })
}

const EXAMPLE_QUERY =
    "핑크 페퍼콘하고 오미자는 없다. 나는 백지, 카다멈, 생강, 계피, 레몬그라스, 백후추, 고수씨, 진피, 박하 등이 있다. 배합해서 밸런스 좋은 배합비 부탁해"

interface BlendAdvisorProps {
    botanicals: Botanical[]
    loggedIn: boolean
}

export function BlendAdvisor({ botanicals, loggedIn }: BlendAdvisorProps) {
    const [query, setQuery] = useState("")
    const [parsed, setParsed] = useState<ParsedIngredient[] | null>(null)

    function handleSubmit() {
        if (!query.trim()) return
        setParsed(parseIngredientQuery(query, botanicals))
    }

    function toggleExclude(id: string) {
        setParsed((prev) => prev && prev.map((p) => (p.botanical.id === id ? { ...p, excluded: !p.excluded } : p)))
    }

    const available = parsed ? parsed.filter((p) => !p.excluded).map((p) => p.botanical) : []
    const excluded = parsed ? parsed.filter((p) => p.excluded).map((p) => p.botanical) : []
    const ratios = computeBalancedRatios(available)
    const weightedChart = computeWeightedChart(ratios)

    return (
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 sm:p-8">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-500">AI Blend Advisor</p>
            </div>
            <h2 className="mt-2 font-serif text-xl font-semibold text-slate-50">보유 재료로 배합비 물어보기</h2>
            <p className="mt-1 text-sm text-slate-400">
                가지고 있는 재료와 없는 재료를 문장으로 자유롭게 적어 물어보세요. 데이터베이스에서 재료를 인식해 밸런스 좋은
                배합비를 계산해 드립니다.
            </p>

            {loggedIn ? (
                <>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={EXAMPLE_QUERY}
                        rows={3}
                        className="mt-6 w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900 p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-opacity hover:opacity-90"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            배합비 추천 받기
                        </button>
                        {parsed ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setParsed(null)
                                    setQuery("")
                                }}
                                className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                초기화
                            </button>
                        ) : null}
                    </div>

                    {parsed ? (
                        parsed.length === 0 ? (
                            <p className="mt-6 text-sm text-slate-500">
                                문장에서 데이터베이스와 일치하는 재료를 찾지 못했습니다. 재료명을 조금 더 구체적으로
                                적어보시거나, 아래 검색에서 원료를 직접 찾아보세요.
                            </p>
                        ) : (
                            <div className="mt-6 space-y-5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        인식된 재료 ({parsed.length}종) — 클릭하면 제외/포함이 전환됩니다
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {parsed.map(({ botanical, excluded: isExcluded }) => (
                                            <button
                                                key={botanical.id}
                                                type="button"
                                                onClick={() => toggleExclude(botanical.id)}
                                                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                                    isExcluded
                                                        ? "border-slate-700 bg-slate-900 text-slate-500 line-through"
                                                        : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-500/60"
                                                }`}
                                            >
                                                {botanical.nameKo} · {botanical.nameEn}
                                            </button>
                                        ))}
                                    </div>
                                    {excluded.length > 0 ? (
                                        <p className="mt-2 text-xs text-slate-500">
                                            제외 재료로 인식됨: {excluded.map((b) => b.nameKo).join(", ")}
                                        </p>
                                    ) : null}
                                </div>

                                {available.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        보유 재료로 인식된 원료가 없습니다. 위 칩을 클릭해 재료를 포함시켜보세요.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="h-56 sm:h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={weightedChart} outerRadius="75%">
                                                    <PolarGrid stroke="#334155" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                                                    <Radar
                                                        name="추천 배합"
                                                        dataKey="A"
                                                        stroke="#f59e0b"
                                                        fill="#f59e0b"
                                                        fillOpacity={0.35}
                                                        strokeWidth={2}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                                추천 배합비 ({available.length}종)
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {ratios
                                                    .slice()
                                                    .sort((a, b) => b.percent - a.percent)
                                                    .map(({ botanical, percent }) => (
                                                        <div key={botanical.id} className="flex items-center gap-3 text-xs">
                                                            <span className="w-24 shrink-0 truncate text-slate-300">{botanical.nameKo}</span>
                                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700/60">
                                                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
                                                            </div>
                                                            <span className="w-10 shrink-0 text-right font-mono text-amber-400">{percent}%</span>
                                                        </div>
                                                    ))}
                                            </div>
                                            <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                                향미 강도가 강한 재료는 비중을 낮추고 은은한 재료는 비중을 높여, 한 가지 향이
                                                과하게 튀지 않도록 계산한 참고용 배합비입니다. 실제 배치 투입 전 소량
                                                테스트를 권장합니다.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : null}
                </>
            ) : (
                <div className="mt-6">
                    <MemberFeatureLock
                        title="AI 배합 상담은 회원 전용 기능입니다"
                        description="로그인하시면 보유 재료를 문장으로 입력해 밸런스 좋은 배합비를 바로 추천받으실 수 있습니다."
                        nextPath="/about/research-lab#botanical-library"
                    />
                </div>
            )}
        </div>
    )
}
