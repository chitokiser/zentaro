import { LevelBenefitsCard } from "@/components/level-benefits-card"
import Link from "next/link"

export const metadata = {
    title: "회원 혜택 안내 | ZenTaro",
    description: "ZenTaro 멤버십 레벨별 혜택을 확인하세요. 레벨업할수록 위스키뱅크 수수료 할인, 스테이킹 보상 강화, 멘토 EXP 보상 등 다양한 혜택이 주어집니다.",
}

const EXP_SOURCES = [
    {
        icon: "💰",
        title: "ZP 충전 보너스",
        description: "USDT 또는 ZP 충전 시, 내 레벨(%)만큼 EXP를 보너스로 지급합니다.",
        example: "Lv.5 × 100,000 ZP 충전 → 5,000 EXP 추가",
        color: "text-emerald-500",
        bg: "bg-emerald-500/8 border-emerald-500/20",
    },
    {
        icon: "👥",
        title: "멘티 결제 EXP 보상",
        description: "내가 가입시킨 멘티가 ZP를 충전할 때마다 결제액의 레벨(%) EXP를 받습니다.",
        example: "Lv.4 × 멘티 50,000 ZP 충전 → 2,000 EXP",
        color: "text-blue-500",
        bg: "bg-blue-500/8 border-blue-500/20",
    },
    {
        icon: "🤝",
        title: "추천 가입 보상",
        description: "내 추천 링크로 신규 멤버가 가입을 완료할 때마다 5,000 EXP를 받습니다.",
        example: "멘티 1명 가입 완료 → +5,000 EXP",
        color: "text-purple-500",
        bg: "bg-purple-500/8 border-purple-500/20",
    },
    {
        icon: "📊",
        title: "ZTRO 스테이킹 배당",
        description: "10,000 ZTRO 이상 스테이킹 시, 주간 배당으로 EXP를 자동 지급합니다.",
        example: "10,000 ZTRO × Lv.3 × 1개월 ÷ 1,000 = 30 EXP/주",
        color: "text-amber-500",
        bg: "bg-amber-500/8 border-amber-500/20",
    },
]

const LEVEL_TABLE = [
    { level: 1, expCost: "—", stakingReward: "–", barrelFee: "15%", mentorExp: "1%", notes: "기본 혜택" },
    { level: 2, expCost: "10,000", stakingReward: "스테이킹×2/1000", barrelFee: "13%", mentorExp: "2%", notes: "배럴 수수료 2% 할인" },
    { level: 3, expCost: "40,000", stakingReward: "스테이킹×3/1000", barrelFee: "12%", mentorExp: "3%", notes: "멘티 EXP 보상 시작" },
    { level: 4, expCost: "90,000", stakingReward: "스테이킹×4/1000", barrelFee: "11%", mentorExp: "4%", notes: "가맹점 ZTRO 보상" },
    { level: 5, expCost: "160,000", stakingReward: "스테이킹×5/1000", barrelFee: "10%", mentorExp: "5%", notes: "스테이킹 배당 강화" },
    { level: 6, expCost: "250,000", stakingReward: "스테이킹×6/1000", barrelFee: "9%", mentorExp: "6%", notes: "" },
    { level: 7, expCost: "360,000", stakingReward: "스테이킹×7/1000", barrelFee: "8%", mentorExp: "7%", notes: "" },
    { level: 8, expCost: "490,000", stakingReward: "스테이킹×8/1000", barrelFee: "7%", mentorExp: "8%", notes: "" },
    { level: 9, expCost: "640,000", stakingReward: "스테이킹×9/1000", barrelFee: "6%", mentorExp: "9%", notes: "" },
    { level: 10, expCost: "810,000", stakingReward: "스테이킹×10/1000", barrelFee: "5%", mentorExp: "10%", notes: "🚀 외부 ZTRO 이체 해제" },
]

export default function BenefitsPage() {
    return (
        <div className="flex flex-col gap-10 pb-16">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/20 px-8 py-10 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)]" />
                <div className="relative">
                    <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">ZenTaro Membership</p>
                    <h1 className="font-display text-3xl font-black text-foreground mb-3">
                        레벨이 올라갈수록<br />
                        <span className="text-amber-500">더 많은 혜택을</span> 누리세요
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        ZenTaro는 Lv.1부터 Lv.10까지의 멤버십 레벨 시스템을 운영합니다.
                        EXP를 모아 레벨업할수록 위스키뱅크 수수료 할인, 강화된 스테이킹 배당,
                        멘토 보상 등 다양한 혜택이 활성화됩니다.
                    </p>
                    <div className="flex gap-3 justify-center mt-6 flex-wrap">
                        <Link
                            href="/my/wallet"
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition"
                        >
                            내 레벨 확인 →
                        </Link>
                        <Link
                            href="/exchange"
                            className="bg-secondary border border-border hover:bg-secondary/80 text-foreground font-medium text-sm px-5 py-2.5 rounded-lg transition"
                        >
                            ZTRO 스테이킹
                        </Link>
                    </div>
                </div>
            </div>

            {/* EXP accumulation */}
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="font-display text-lg font-bold text-foreground">EXP 적립 방법</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">다양한 활동으로 EXP를 쌓고 레벨을 높이세요</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EXP_SOURCES.map((s) => (
                        <div key={s.title} className={`rounded-xl border p-4 ${s.bg}`}>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl shrink-0">{s.icon}</span>
                                <div>
                                    <h3 className={`text-sm font-bold ${s.color}`}>{s.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                                    <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono bg-background/40 rounded px-2 py-1 inline-block">
                                        예) {s.example}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Level preview card (static Lv.1) */}
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="font-display text-lg font-bold text-foreground">레벨별 혜택 미리보기</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">현재 내 레벨에서 해제된 혜택을 지갑 페이지에서 확인하세요</p>
                </div>
                <LevelBenefitsCard level={1} exp={0} />
                <p className="text-xs text-muted-foreground text-center">
                    ↑ 지갑 페이지에서는 실제 레벨 기반으로 표시됩니다 —{" "}
                    <Link href="/my/wallet" className="text-primary underline underline-offset-2">
                        지갑으로 이동
                    </Link>
                </p>
            </section>

            {/* Full level comparison table */}
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="font-display text-lg font-bold text-foreground">레벨별 상세 혜택 비교</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">레벨업 비용 = 현재레벨² × 10,000 EXP</p>
                </div>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="bg-secondary/60 text-muted-foreground border-b border-border/50">
                                    <th className="px-4 py-3 font-semibold">레벨</th>
                                    <th className="px-4 py-3 font-semibold">레벨업 EXP</th>
                                    <th className="px-4 py-3 font-semibold">스테이킹 배당(주)</th>
                                    <th className="px-4 py-3 font-semibold">배럴 거래 수수료</th>
                                    <th className="px-4 py-3 font-semibold">멘토 EXP 보상</th>
                                    <th className="px-4 py-3 font-semibold">특별 혜택</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {LEVEL_TABLE.map((row) => (
                                    <tr key={row.level} className={`hover:bg-secondary/10 ${row.level === 10 ? "bg-amber-500/5" : ""}`}>
                                        <td className="px-4 py-3">
                                            <span className={`font-bold ${row.level === 10 ? "text-amber-500" : "text-foreground"}`}>
                                                Lv.{row.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{row.expCost}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.stakingReward}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-emerald-500 font-semibold">{row.barrelFee}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-blue-500 font-semibold">{row.mentorExp}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ-style notes */}
            <section className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-bold text-foreground">자주 묻는 질문</h2>
                <div className="grid gap-3">
                    {[
                        {
                            q: "레벨업은 언제 할 수 있나요?",
                            a: "충분한 EXP가 쌓이면 지갑 페이지에서 언제든지 수동으로 레벨업할 수 있습니다. 자동 레벨업은 없습니다.",
                        },
                        {
                            q: "레벨업 후 EXP는 어떻게 되나요?",
                            a: "레벨업에 사용된 EXP는 차감되며, 남은 EXP는 다음 레벨업을 위해 보존됩니다.",
                        },
                        {
                            q: "스테이킹 배당을 받으려면 최소 스테이킹이 필요한가요?",
                            a: "네, 주간 스테이킹 배당 보상은 최소 10,000 ZTRO 이상 스테이킹한 경우에만 지급됩니다.",
                        },
                        {
                            q: "외부 ZTRO 이체는 레벨 10만 가능한가요?",
                            a: "네, 보유한 ZTRO를 외부 개인 지갑으로 전송하는 기능은 플랫폼 신뢰도 확보를 위해 레벨 10 멤버에게만 활성화됩니다.",
                        },
                    ].map((item) => (
                        <div key={item.q} className="rounded-xl border border-border/60 bg-card px-5 py-4">
                            <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
