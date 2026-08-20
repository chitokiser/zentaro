"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Dna,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    FlaskConical,
    Beaker,
} from "lucide-react"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from "recharts"
import {
    getToken,
    onAuthChanged,
    fetchFlavorLabProjects,
    fetchFlavorLabBotanicals,
    analyzeFlavorLabProject,
    type FlavorLabProject,
    type FlavorLabBotanical,
    type FlavorLabAnalyzeResult,
} from "@/lib/auth-client"
import { MemberFeatureLock } from "@/components/research-lab/member-feature-lock"

type Tab = "aroma" | "taste" | "mouthfeel" | "finish"

const TABS: { key: Tab; label: string }[] = [
    { key: "aroma", label: "AROMA" },
    { key: "taste", label: "TASTE" },
    { key: "mouthfeel", label: "MOUTHFEEL" },
    { key: "finish", label: "FINISH" },
]

const AXIS_LABELS: Record<string, string> = {
    floral: "플로럴", fruity: "프루티", citrus: "시트러스", herbal: "허벌", spicy: "스파이시",
    woody: "우디", earthy: "어시", vanilla: "바닐라", roasted: "로스티드",
    sweet: "단맛", sour: "신맛", bitter: "쓴맛", umami: "감칠맛", salty: "짠맛", astringency: "떫은맛",
    light: "라이트", body: "바디감", warmth: "알코올감", smoothness: "부드러움", dryness: "드라이함",
    short: "짧음", medium: "중간", long: "긺", dry: "드라이", spicy_finish: "스파이시",
}

const DEFAULT_ACCENT = "#f59e0b"

function radarData(category: Record<string, number>) {
    return Object.entries(category).map(([key, value]) => ({
        subject: AXIS_LABELS[key] ?? key,
        A: Math.round(value),
        fullMark: 100,
    }))
}

export default function AiVirtualResearchLab() {
    const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
    const [projects, setProjects] = useState<FlavorLabProject[]>([])
    const [botanicalCatalog, setBotanicalCatalog] = useState<Map<string, FlavorLabBotanical>>(new Map())
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loadingCatalog, setLoadingCatalog] = useState(true)
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [analyzeError, setAnalyzeError] = useState<string | null>(null)
    const [result, setResult] = useState<FlavorLabAnalyzeResult | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>("aroma")

    useEffect(() => onAuthChanged(() => setLoggedIn(Boolean(getToken()))), [])

    useEffect(() => {
        if (!loggedIn) {
            setLoadingCatalog(false)
            return
        }
        setLoadingCatalog(true)
        Promise.all([fetchFlavorLabProjects(), fetchFlavorLabBotanicals()])
            .then(([projectList, botanicalList]) => {
                setProjects(projectList)
                setBotanicalCatalog(new Map(botanicalList.map((b) => [b.id, b])))
                setSelectedId(projectList[0]?.id ?? null)
            })
            .catch((err) => setCatalogError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다."))
            .finally(() => setLoadingCatalog(false))
    }, [loggedIn])

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedId) ?? null,
        [projects, selectedId],
    )

    const accent = selectedProject?.accentColor || DEFAULT_ACCENT

    function handleSelectProject(id: string) {
        setSelectedId(id)
        setResult(null)
        setAnalyzeError(null)
        setActiveTab("aroma")
    }

    async function handleAnalyze() {
        if (!selectedProject) return
        setAnalyzing(true)
        setAnalyzeError(null)
        try {
            const res = await analyzeFlavorLabProject(selectedProject.id, "ko")
            setResult(res)
        } catch (err) {
            setAnalyzeError(err instanceof Error ? err.message : "분석에 실패했습니다.")
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 px-4 py-16 sm:px-6 lg:px-8" style={{ ["--accent" as string]: accent }}>
            {/* Header */}
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-5 flex justify-center">
                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-full border"
                        style={{ borderColor: `${accent}4d`, backgroundColor: `${accent}1a` }}
                    >
                        <Dna className="h-7 w-7" style={{ color: accent }} />
                    </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.4em]" style={{ color: accent }}>
                    ZENTARO Research Lab
                </p>
                <h1 className="mt-4 font-serif text-4xl font-semibold text-slate-50 sm:text-5xl">
                    AI VIRTUAL RESEARCH LAB
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-300 sm:text-base">
                    Predict the Flavor DNA Before You Distill
                </p>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                    R&amp;D 프로젝트를 선택하면 등록된 보태니컬 데이터와 추출 조건을 기반으로 예상되는 향·맛·질감·피니시를
                    AI가 예측합니다. 실제 증류 전, 화면에서 먼저 맛을 그려보세요.
                </p>
            </div>

            {!loggedIn ? (
                <div className="mx-auto mt-10 max-w-xl">
                    <MemberFeatureLock
                        title="AI Virtual Research Lab은 회원 전용 기능입니다"
                        description="로그인하시면 R&D 프로젝트를 선택해 예상 Flavor DNA와 AI 테이스팅 예측을 확인하실 수 있습니다."
                        nextPath="/about/research-lab#ai-virtual-lab"
                    />
                </div>
            ) : null}

            {loggedIn && catalogError ? (
                <p className="mx-auto mt-10 max-w-xl text-center text-sm text-destructive">{catalogError}</p>
            ) : null}

            {loggedIn && loadingCatalog ? (
                <div className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Research Lab 데이터를 불러오는 중...
                </div>
            ) : null}

            {loggedIn && !loadingCatalog && !catalogError ? (
                <div className="mx-auto mt-14 max-w-4xl">
                    {/* Project select */}
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                        Select R&amp;D Project
                    </label>
                    <select
                        value={selectedId ?? ""}
                        onChange={(e) => handleSelectProject(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-700/60 bg-slate-800 px-4 py-3 font-serif text-lg text-slate-50 focus:border-amber-500/60 focus:outline-none"
                        style={{ borderColor: `${accent}66` }}
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.projectName}
                            </option>
                        ))}
                    </select>

                    {selectedProject ? (
                        <>
                            {/* Recipe info */}
                            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-700/60 bg-slate-800 p-5 sm:grid-cols-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Base Spirit</p>
                                    <p className="mt-1 text-sm font-medium text-slate-100">{selectedProject.baseSpirit}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Base ABV</p>
                                    <p className="mt-1 text-sm font-medium text-slate-100">{selectedProject.baseAbv}%</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Target ABV</p>
                                    <p className="mt-1 text-sm font-medium text-slate-100">{selectedProject.targetAbv}%</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Extraction</p>
                                    <p className="mt-1 text-sm font-medium text-slate-100">
                                        {selectedProject.extractionMethod} · {selectedProject.extractionTimeHours}h · {selectedProject.extractionTemperatureC}°C
                                    </p>
                                </div>
                            </div>

                            {/* Botanicals */}
                            <div className="mt-6">
                                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Botanicals</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {selectedProject.botanicals.map((dose) => {
                                        const b = botanicalCatalog.get(dose.botanicalId)
                                        if (!b) return null
                                        return (
                                            <div
                                                key={dose.botanicalId}
                                                className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-4"
                                            >
                                                <div className="flex items-baseline justify-between">
                                                    <p className="font-serif text-base font-semibold text-slate-50">{b.name}</p>
                                                    <span className="font-mono text-sm text-slate-300">{dose.doseGrams}g</span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {b.localName ? `${b.localName} · ` : ""}
                                                    Top {AXIS_LABELS[b.topAroma[0]] ?? b.topAroma[0]}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                                                    {b.topAroma.map((a) => (
                                                        <span key={a} className="rounded-full border border-slate-700 px-2 py-0.5">
                                                            Top: {a}
                                                        </span>
                                                    ))}
                                                    {b.midAroma.map((a) => (
                                                        <span key={a} className="rounded-full border border-slate-700 px-2 py-0.5">
                                                            Mid: {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Analyze CTA */}
                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-widest text-slate-950 transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: accent }}
                                >
                                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                                    {analyzing ? "Analyzing Flavor DNA..." : "Analyze Flavor DNA"}
                                </button>
                            </div>

                            {analyzeError ? (
                                <p className="mt-4 text-center text-sm text-destructive">{analyzeError}</p>
                            ) : null}

                            {/* Result */}
                            {result ? (
                                <div className="mt-10 border-t border-slate-700/60 pt-10">
                                    <p className="text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
                                        Prediction — no product has actually been distilled or tasted yet
                                    </p>
                                    <h2 className="mt-2 text-center font-serif text-2xl font-semibold text-slate-50">
                                        Flavor DNA
                                    </h2>

                                    {/* Tabs */}
                                    <div className="mx-auto mt-6 flex max-w-md justify-center gap-1 rounded-full border border-slate-700/60 bg-slate-800 p-1">
                                        {TABS.map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setActiveTab(tab.key)}
                                                className="flex-1 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                                                style={
                                                    activeTab === tab.key
                                                        ? { backgroundColor: accent, color: "#0f172a" }
                                                        : { color: "#94a3b8" }
                                                }
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mx-auto mt-6 h-72 w-full max-w-xl sm:h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData(result.flavorDna[activeTab])} outerRadius="75%">
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                                                <Radar
                                                    name={selectedProject.projectName}
                                                    dataKey="A"
                                                    stroke={accent}
                                                    fill={accent}
                                                    fillOpacity={0.35}
                                                    strokeWidth={2}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* AI Tasting Prediction */}
                                    <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-slate-700/60 bg-slate-800 p-6">
                                        <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accent }}>
                                            AI Tasting Prediction
                                        </p>
                                        {result.narrative ? (
                                            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                                                <p><span className="font-semibold text-slate-100">예상 향(Nose) — </span>{result.narrative.nose}</p>
                                                <p><span className="font-semibold text-slate-100">첫맛(Attack) — </span>{result.narrative.attack}</p>
                                                <p><span className="font-semibold text-slate-100">중간 맛(Mid Palate) — </span>{result.narrative.midPalate}</p>
                                                <p><span className="font-semibold text-slate-100">피니시(Finish) — </span>{result.narrative.finish}</p>
                                            </div>
                                        ) : (
                                            <p className="mt-4 text-sm text-slate-400">
                                                AI 서술 생성에 실패해 수치 데이터만 표시합니다. 위 Flavor DNA 그래프를 참고해주세요.
                                            </p>
                                        )}
                                    </div>

                                    {/* AI Research Note */}
                                    {result.narrative ? (
                                        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-slate-700/60 bg-slate-800 p-6">
                                            <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accent }}>
                                                AI Research Note
                                            </p>
                                            <div className="mt-4 space-y-2">
                                                {result.narrative.strengths.map((s, i) => (
                                                    <p key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                                                        {s}
                                                    </p>
                                                ))}
                                                {result.narrative.risks.map((r, i) => (
                                                    <p key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                                        {r}
                                                    </p>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                                                <Beaker className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                                                {result.narrative.recommendation}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
