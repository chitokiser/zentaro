"use client"

interface LevelBenefitsCardProps {
    level: number
    exp: number
    onLevelUp?: () => void
    levelUpBusy?: boolean
    levelUpError?: string | null
    levelUpSuccess?: string | null
}

function expCostForLevel(level: number): number {
    return level * level * 10000
}

const MAX_LEVEL = 10

const BENEFITS: { level: number; icon: string; title: string; description: string }[] = [
    {
        level: 1,
        icon: "🎯",
        title: "에어드랍 참여 · 멘토 자격",
        description: "Ztaro 에어드랍 이벤트 참여 가능. 추천 링크로 멘티를 모집할 수 있는 멘토 자격이 부여됩니다.",
    },
    {
        level: 2,
        icon: "🥃",
        title: "위스키뱅크 수수료 할인",
        description: "오크 배럴 P2P 거래 수수료를 레벨만큼 할인합니다. (기본 15% → Lv.2 이후 매 레벨마다 1%씩 추가 감면, 최소 1%)",
    },
    {
        level: 3,
        icon: "🎓",
        title: "멘티 결제 EXP 보상",
        description: "가입시킨 멘티가 ZP를 충전할 때마다 결제액의 레벨만큼 EXP를 보상받습니다. (Lv.3 = 충전액의 3% EXP)",
    },
    {
        level: 4,
        icon: "🏪",
        title: "가맹점 Ztaro 보상",
        description: "제휴 가맹점에서 ZP로 결제 시 결제액 × 레벨 ÷ 10,000 만큼 Ztaro를 보상받습니다.",
    },
    {
        level: 5,
        icon: "📈",
        title: "스테이킹 배당 강화",
        description: "Ztaro 스테이킹 주간 배당 공식: 스테이킹수량 × 레벨 × 스테이킹개월 ÷ 1,000 EXP (최소 10,000 Ztaro 스테이킹 필요)",
    },
    {
        level: 10,
        icon: "🚀",
        title: "외부 지갑 Ztaro 이체",
        description: "레벨 10 달성 시 보유 Ztaro를 외부 지갑으로 자유롭게 이체할 수 있는 기능이 해제됩니다.",
    },
]

export function LevelBenefitsCard({
    level,
    exp,
    onLevelUp,
    levelUpBusy,
    levelUpError,
    levelUpSuccess,
}: LevelBenefitsCardProps) {
    const isMaxLevel = level >= MAX_LEVEL
    const cost = isMaxLevel ? null : expCostForLevel(level)
    const progress = cost ? Math.min((exp / cost) * 100, 100) : 100

    return (
        <div className="rounded-xl border border-amber-500/20 bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-5 py-4 flex items-center justify-between gap-4 border-b border-amber-500/10">
                <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">멤버십 레벨</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">레벨업할수록 다양한 혜택을 누리세요</p>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider">
                        {isMaxLevel ? "MAX" : `Lv.${level} → ${level + 1}`}
                    </div>
                    <div className="font-display text-4xl font-black text-amber-500 leading-none mt-0.5">
                        {level}
                        <span className="text-base font-medium text-amber-400/70 ml-0.5">Lv</span>
                    </div>
                </div>
            </div>

            {/* EXP progress */}
            <div className="px-5 py-4 border-b border-border/40">
                {isMaxLevel ? (
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold">
                        <span>🏆</span> 최고 레벨 달성! 모든 혜택이 해제되었습니다
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-muted-foreground">
                                레벨업 필요 EXP:{" "}
                                <span className="text-foreground font-semibold">{cost!.toLocaleString()}</span>
                            </span>
                            <span className="text-muted-foreground">
                                보유:{" "}
                                <span className={`font-semibold ${exp >= cost! ? "text-emerald-500" : "text-foreground"}`}>
                                    {exp.toLocaleString()}
                                </span>
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {levelUpError && <p className="text-xs text-destructive mt-2">{levelUpError}</p>}
                        {levelUpSuccess && <p className="text-xs text-emerald-500 mt-2">{levelUpSuccess}</p>}
                        <button
                            type="button"
                            disabled={levelUpBusy || exp < cost!}
                            onClick={onLevelUp}
                            className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-sm rounded-lg py-2.5 transition active:scale-[0.98]"
                        >
                            {levelUpBusy
                                ? "레벨업 중..."
                                : exp >= cost!
                                    ? `⬆ Lv.${level + 1} 레벨업 (${cost!.toLocaleString()} EXP 소모)`
                                    : `EXP 부족 (${(cost! - exp).toLocaleString()} 더 필요)`}
                        </button>
                    </>
                )}
            </div>

            {/* Benefits list */}
            <div className="px-5 py-4 flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">레벨별 혜택</h4>
                <div className="grid gap-2">
                    {BENEFITS.map((b) => {
                        const unlocked = level >= b.level
                        return (
                            <div
                                key={b.level}
                                className={`rounded-lg px-3 py-2.5 flex gap-3 items-start transition-colors ${unlocked
                                        ? "bg-amber-500/8 border border-amber-500/20"
                                        : "bg-secondary/20 border border-border/30 opacity-50"
                                    }`}
                            >
                                <span className="text-lg shrink-0 mt-0.5">{unlocked ? b.icon : "🔒"}</span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`text-xs font-bold ${unlocked ? "text-amber-500" : "text-muted-foreground"}`}
                                        >
                                            Lv.{b.level}
                                        </span>
                                        <span className="text-xs font-semibold text-foreground">{b.title}</span>
                                        {unlocked && (
                                            <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded font-medium">
                                                해제됨
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{b.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
