"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    fetchWallet,
    fetchExchangeDashboard,
    submitBarrelOrder,
    fetchMyBarrels,
    triggerBarrelAction,
    fetchPublicBarrels,
    listBarrelForSale,
    cancelBarrelSale,
    buyBarrel,
    fetchMe,
    type BarrelDocument,
    type PublicBarrel
} from "@/lib/auth-client"
import { BarrelVisual, formatAgingDuration, AGING_TARGET_SECONDS } from "@/components/rewards/barrel-visual"
import {
    Wine,
    Flame,
    ShieldCheck,
    MapPin,
    Truck,
    Gem,
    Award,
    Layers,
    History,
    FileText,
    HelpCircle,
    QrCode,
    Calendar,
    AlertTriangle,
    PenTool,
    CheckCircle2,
    Users,
    Tag,
    ShoppingCart,
    Timer
} from "lucide-react"

interface BarrelSpec {
    size: string
    label: string
    capacity: string
    agingPeriod: string
    recommendedSpirit: string
    expRequirement: string
    ztroRequirementValue: number
    expRequirementValue: number
    dimensions: string
    woodType: string
    description: string
}

const BARREL_SPECS: BarrelSpec[] = [
    {
        size: "5L",
        label: "5L Oak Barrel",
        capacity: "5 Liters (약 7병 분량)",
        agingPeriod: "6개월 ~ 12개월 권장",
        recommendedSpirit: "ZENTARO Craft Botanical Gin Base",
        expRequirement: "50,000 ZTRO 스테이킹 + 500,000 EXP 차감",
        ztroRequirementValue: 50000,
        expRequirementValue: 500000,
        dimensions: "26cm x 18cm x 18cm",
        woodType: "American White Oak (Medium Toasting)",
        description: "홈 바(Home Bar) 및 소가족형 멤버를 위한 실속형 배럴입니다. 오크 풍미가 빠르게 배어나와 비교적 단기간에 고유한 아로마 숙성 과정을 관찰하고 완성할 수 있습니다."
    },
    {
        size: "10L",
        label: "10L Oak Barrel",
        capacity: "10 Liters (약 14병 분량)",
        agingPeriod: "12개월 ~ 18개월 권장",
        recommendedSpirit: "ZENTARO Distilled Single Malt New Make",
        expRequirement: "100,000 ZTRO 스테이킹 + 1,000,000 EXP 차감",
        ztroRequirementValue: 100000,
        expRequirementValue: 1000000,
        dimensions: "34cm x 24cm x 24cm",
        woodType: "Alligator Charred Honey Oak",
        description: "가장 인기 있는 스탠다드 오크 사양입니다. 천연 오크 타닌과 바닐린이 조화롭게 작용하여 향과 맛의 밸런스가 뛰어나며, 프라이빗 룸이나 소형 콜렉션 전시용으로 매우 적합합니다."
    },
    {
        size: "20L",
        label: "20L Oak Barrel",
        capacity: "20 Liters (약 28병 분량)",
        agingPeriod: "18개월 ~ 24개월 권장",
        recommendedSpirit: "Premium French Brandy Base",
        expRequirement: "200,000 ZTRO 스테이킹 + 2,000,000 EXP 차감",
        ztroRequirementValue: 200000,
        expRequirementValue: 2000000,
        dimensions: "42cm x 30cm x 30cm",
        woodType: "European Limousin Oak (Heavy Toasting)",
        description: "진정한 위스키/브랜디 애호가를 위한 본격적인 숙성용 배럴입니다. 적당한 표면적 대비 부피 비율 덕분에 급격한 증발 손실 없이 장기간 숙성하며 풍미를 다채롭게 발달시킬 수 있습니다."
    },
    {
        size: "40L",
        label: "40L Oak Barrel",
        capacity: "40 Liters (약 56병 분량)",
        agingPeriod: "24개월 ~ 36개월 이상 권장",
        recommendedSpirit: "ZENTARO Single Grain Bourbon Style Base",
        expRequirement: "400,000 ZTRO 스테이킹 + 4,000,000 EXP 차감",
        ztroRequirementValue: 400000,
        expRequirementValue: 4000000,
        dimensions: "52cm x 38cm x 38cm",
        woodType: "Ex-Bourbon White Oak Barrel",
        description: "최고의 마스터피스를 추구하는 VVIP 리저브 용량입니다. 최고의 밸런스를 유도하기 위한 중-장기 숙성에 최적화되어 있으며, 젠타로 배럴룸의 가장 안정적인 구역에서 철저하게 관리됩니다."
    }
]

const BARREL_DELIVERY_FEES: Record<string, number> = {
    "5L": 5000,
    "10L": 8000,
    "20L": 12000,
    "40L": 20000,
}

const FLAVORS = [
    { name: "Vanilla", desc: "천연 오크의 리그닌 분해에서 오는 달콤하고 부드러운 화이트 아로마" },
    { name: "Caramel", desc: "가열된 목질부 설탕 성분의 캐러멜화 과정에서 형성되는 깊은 단맛" },
    { name: "Toffee", desc: "토스팅 단계를 지나며 다크초콜릿과 카라멜이 결합된 버터 풍미" },
    { name: "Cocoa", desc: "천천히 배어나는 쌉싸름하면서도 고소한 다크 카카오 향조" },
    { name: "Chocolate", desc: "헤비 차링을 통해 완성되는 긴 여운의 마일드 초콜릿 노트" },
    { name: "Smoky", desc: "오크통 내부를 직접 그을려 나무 타르에서 발생하는 매혹적인 훈연향" },
    { name: "Spice", desc: "계피, 넛맥 등을 연상시키는 에이징 고유의 복합적이고 스파이시한 노트" },
    { name: "Roasted Nut", desc: "고열 가공된 헤미셀룰로스 구조에서 유래하는 고소한 견과류 풍미" },
    { name: "Oak Aroma", desc: "고급 목재 고유의 천연 수액과 숲길을 걷는 듯한 클래식 우디 노트" }
]

export default function BarrelReservePage() {
    const [errorProfile, setErrorProfile] = useState<string | null>(null)

    // User Info & Balances
    const [expBalance, setExpBalance] = useState<number>(0)
    const [stakedZtro, setStakedZtro] = useState<number>(0)
    const [walletAddress, setWalletAddress] = useState<string>("")

    // Interactive Barrel Selection
    const [selectedSize, setSelectedSize] = useState<string>("10L")
    const currentSpec = BARREL_SPECS.find(spec => spec.size === selectedSize) || BARREL_SPECS[1]

    // My Barrels List
    const [barrels, setBarrels] = useState<BarrelDocument[]>([])
    const [actionBusy, setActionBusy] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    const [myUid, setMyUid] = useState<string>("")

    // Public Gallery (other members' barrels)
    const [publicBarrels, setPublicBarrels] = useState<PublicBarrel[]>([])
    const [galleryLoading, setGalleryLoading] = useState<boolean>(true)

    // Live ticking clock, used to compute cumulative aging duration client-side
    const [nowTick, setNowTick] = useState<number>(() => Math.floor(Date.now() / 1000))

    // Modals for Cert & QR Viewers
    const [activeCertBarrel, setActiveCertBarrel] = useState<BarrelDocument | null>(null)
    const [activeQrBarrel, setActiveQrBarrel] = useState<BarrelDocument | null>(null)

    const loadData = useCallback(async () => {
        try {
            const wallet = await fetchWallet()
            setExpBalance(wallet.exp)

            const dashboard = await fetchExchangeDashboard()
            setStakedZtro(dashboard.staked)
            setWalletAddress(dashboard.address)

            const myBarrelsList = await fetchMyBarrels()
            setBarrels(myBarrelsList)

            const me = await fetchMe()
            setMyUid(me.uid)
        } catch (err) {
            console.error("Failed to load user and barrel data:", err)
            const msg = err instanceof Error ? err.message : "회원 정보를 불러오지 못했습니다."
            setErrorProfile(msg)
        }
    }, [])

    const loadPublicGallery = useCallback(async () => {
        setGalleryLoading(true)
        try {
            const list = await fetchPublicBarrels()
            setPublicBarrels(list)
        } catch (err) {
            console.error("Failed to load public barrel gallery:", err)
        } finally {
            setGalleryLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        loadPublicGallery()
    }, [loadData, loadPublicGallery])

    useEffect(() => {
        const timer = setInterval(() => setNowTick(Math.floor(Date.now() / 1000)), 1000)
        return () => clearInterval(timer)
    }, [])

    const agingSecondsFor = useCallback(
        (productionDate?: { _seconds: number } | null, agingEndedAt?: { _seconds: number } | null) => {
            const startSec = productionDate?._seconds
            if (!startSec) return 0
            const endSec = agingEndedAt?._seconds ?? nowTick
            return Math.max(0, endSec - startSec)
        },
        [nowTick],
    )

    const handleOrderSubmit = async () => {
        const cost = currentSpec.expRequirementValue
        const ztroNeed = currentSpec.ztroRequirementValue

        if (stakedZtro < ztroNeed) {
            alert(`주문 자격 요건이 부족합니다. 최소 ${ztroNeed.toLocaleString()} ZTRO를 스테이킹해야 합니다. (보보유: ${stakedZtro.toLocaleString()} ZTRO)`)
            return
        }

        if (expBalance < cost) {
            alert(`EXP 잔액이 부족합니다. 최소 ${cost.toLocaleString()} EXP가 차감 가능해야 합니다. (보유: ${expBalance.toLocaleString()} EXP)`)
            return
        }

        if (!confirm(`${currentSpec.label} 배럴 예약을 요청하시겠습니까? 신청 시 ${cost.toLocaleString()} EXP가 즉시 차감됩니다.`)) {
            return
        }

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)

        try {
            const result = await submitBarrelOrder(selectedSize)
            setActionSuccess(`주문 완료! 고유 배럴 ID: ${result.barrelId} 예약 및 소유권 카드 생성이 자동으로 완료되었습니다.`)
            await loadData()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "배럴 주문 처리에 실패했습니다.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleBarrelAction = async (barrelId: string, action: string) => {
        if (!confirm("해당 부가 서비스를 신청하시겠습니까?")) return

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)

        try {
            const result = await triggerBarrelAction(barrelId, action)
            setActionSuccess(`신청 성공! 상태: ${result.nextStatus} (${result.nextSealStatus}) 로 변경되었습니다.`)
            await loadData()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "처리에 실패했습니다.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleListForSale = async (barrelId: string, currentValueZp: number) => {
        if (!confirm(`현재 시세 ${currentValueZp.toLocaleString()} ZP로 이 배럴을 판매 등록하시겠습니까? 가격은 용량과 숙성 시간에 따라 자동 산정되며 오너가 임의로 정할 수 없습니다. 등록 중에는 배송/병입 신청이 제한됩니다.`)) return

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await listBarrelForSale(barrelId)
            setActionSuccess("판매 등록이 완료되었습니다.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "판매 등록에 실패했습니다.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleCancelSale = async (barrelId: string) => {
        if (!confirm("판매 등록을 취소하시겠습니까?")) return
        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await cancelBarrelSale(barrelId)
            setActionSuccess("판매 등록이 취소되었습니다.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "판매 취소에 실패했습니다.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleBuyBarrel = async (barrel: PublicBarrel) => {
        if (!confirm(`${barrel.currentValueZp.toLocaleString()} ZP를 지불하고 이 배럴(${barrel.id})을 구매하시겠습니까? 구매 시점의 실시간 시세가 최종 결제됩니다.`)) return
        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await buyBarrel(barrel.id)
            setActionSuccess("배럴 구매가 완료되었습니다. 내 배럴 컬렉션에서 확인해보세요.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "구매에 실패했습니다.")
        } finally {
            setActionBusy(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                eyebrow="서비스"
                title="ZenTaro Barrel Reserve"
                description={<><span className="notranslate">EXP</span> 회원 전용 프리미엄 배럴 프로그램 — 시간을 소유하는 사람들을 위한 특별한 경험</>}
            />

            <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">

                {/* User Gating or Balance Summary Bar */}
                {errorProfile === "로그인이 필요합니다." ? (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm text-yellow-600/90 text-center">
                        해당 등급 전용 서비스 정보 확인 및 신청을 위해 먼저 로그인이 필요합니다.{" "}
                        <Link href="/my/profile" className="text-amber-500 underline underline-offset-4 font-bold ml-2">
                            로그인 하러가기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm">
                        <div>
                            <span className="text-xs text-muted-foreground block">총 ZTRO 스테이킹 수량</span>
                            <span className="text-base font-bold text-foreground mt-1 block">
                                {stakedZtro.toLocaleString()} ZTRO
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">사용 가능한 <span className="notranslate">EXP</span> 보유고</span>
                            <span className="text-base font-bold text-amber-500 mt-1 block">
                                {expBalance.toLocaleString()} <span className="notranslate">EXP</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Intro Section */}
                <section className="text-center max-w-3xl mx-auto space-y-4">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 px-3 py-1 bg-amber-500/5 font-mono">
                        STAKE. AGE. OWN.
                    </Badge>
                    <h2 className="font-display text-2xl font-bold sm:text-3xl text-foreground">
                        시간이 빚어내는 궁극의 오리지널 풍미
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        ZenTaro Barrel Reserve는 단순히 술을 구매하는 프로그램이 아닙니다.
                        회원은 ZenTaro 주류원(Distillery)이 직접 증류한 최상급 중성주와 원주를 엄선된 프리미엄 오크 배럴에 담아,
                        프라이빗 숙성 환경 속에서 시간이 더해가는 무한한 가치를 직접 설계하고 소유 공유하게 됩니다.
                    </p>
                    <div className="flex justify-center pt-2">
                        <div className="relative group max-w-sm w-full overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-b from-amber-500/5 to-transparent p-1">
                            <img
                                src="/images/rewards/barrel.png"
                                alt="ZenTaro Premium Oak Barrel"
                                className="w-full h-auto rounded-xl object-contain opacity-90 group-hover:opacity-100 group-hover:scale-[1.01] transition duration-700 max-h-64 mx-auto"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>
                </section>

                {/* Action Status Output */}
                {actionSuccess && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{actionSuccess}</span>
                    </div>
                )}
                {actionError && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{actionError}</span>
                    </div>
                )}

                {/* Premium Oak Barrel Selection Area */}
                <section className="space-y-6">
                    <div className="border-b border-border/60 pb-3">
                        <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                            <Wine className="w-5 h-5 text-amber-500" />
                            Premium Oak Barrel 프리미엄 배럴 선택
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            요건에 따른 최적의 용량 배럴을 분양받으시고, 나만의 프리미엄 스피릿 에이징 포트폴리오를 만들어보세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {BARREL_SPECS.map((spec) => (
                            <button
                                key={spec.size}
                                type="button"
                                onClick={() => setSelectedSize(spec.size)}
                                className={`text-left p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group ${selectedSize === spec.size
                                    ? "border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10"
                                    : "border-border/60 bg-card hover:border-amber-500/40 hover:bg-card/80"
                                    }`}
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <Badge variant="secondary" className="font-mono text-xs font-bold bg-zinc-800 text-zinc-300">
                                            {spec.size}
                                        </Badge>
                                        {selectedSize === spec.size && (
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        )}
                                    </div>
                                    <h4 className="mt-3 font-display font-medium text-foreground text-sm group-hover:text-amber-500 transition-colors">
                                        {spec.label}
                                    </h4>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono truncate w-full">
                                    {spec.capacity}
                                </span>

                                {/* Visual wood decoration */}
                                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                                    <Wine className="w-20 h-20 transform translate-x-4 translate-y-4" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Interactive Specification View & Checkout */}
                    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono">
                                        ZT-REV-{currentSpec.size}-SPECS
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        오크 재질 정보 포함
                                    </span>
                                </div>

                                <h4 className="font-display text-2xl font-semibold text-foreground">
                                    {currentSpec.label} 상세 스펙
                                </h4>

                                <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                                    {currentSpec.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">총 보관 용량</span>
                                        <span className="text-sm font-semibold font-mono text-foreground">{currentSpec.capacity}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">권장 파스/에이징 기간</span>
                                        <span className="text-sm font-semibold text-foreground">{currentSpec.agingPeriod}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">추천 마스터 원주</span>
                                        <span className="text-sm font-semibold text-amber-500">{currentSpec.recommendedSpirit}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">오크 규격 및 산지</span>
                                        <span className="text-sm font-semibold text-foreground">{currentSpec.woodType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background/80 rounded-lg p-5 border border-border/40 flex flex-col justify-between space-y-4">
                                <div>
                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                                        Order Requirements
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        주문 시 토큰 스테이킹 조건을 충족해야 하며, 명시된 회원 전용 <span className="notranslate">EXP</span>가 즉시 차감 소모됩니다.
                                    </p>
                                </div>
                                <div className="bg-card p-3 rounded border border-amber-500/10 text-xs space-y-1">
                                    <span className="text-muted-foreground block">필요 스테이킹:</span>
                                    <span className="text-foreground font-semibold block">
                                        {currentSpec.ztroRequirementValue.toLocaleString()} ZTRO 이상
                                    </span>
                                    <span className="text-muted-foreground block mt-1">소요 비용:</span>
                                    <span className="text-amber-500 font-bold block">
                                        {currentSpec.expRequirementValue.toLocaleString()} <span className="notranslate">EXP</span> 즉시 차감
                                    </span>
                                </div>
                                <Button
                                    onClick={handleOrderSubmit}
                                    disabled={actionBusy || errorProfile === "로그인이 필요합니다."}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs py-2 shadow"
                                >
                                    {actionBusy ? "신청 처리 중..." : `${currentSpec.size} 배럴 분양 신청하기`}
                                </Button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* My Barrel Collection Section */}
                {errorProfile !== "로그인이 필요합니다." && (
                    <section className="space-y-6">
                        <div className="border-b border-border/60 pb-3">
                            <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Award className="w-5 h-5 text-amber-500" />
                                내 배럴 컬렉션 (My Barrel Collection)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                회원님께서 보유하신 프라이빗 오크통 리저브 목록입니다. 인증서 조회 및 입출고 케어를 바로 실행해보세요.
                            </p>
                        </div>

                        {barrels.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                보유 중인 배럴이 없습니다. 위 보증 조건에 맞추어 첫 번째 배럴 주문에 참여해 보세요!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {barrels.map((barrel) => {
                                    const spec = BARREL_SPECS.find(s => s.size === barrel.capacity)
                                    const isDone = barrel.status === "직접 배송 완료" || barrel.status === "병입 완료 및 출고"
                                    const isAging = !isDone
                                    const agingSeconds = agingSecondsFor(barrel.productionDate, barrel.agingEndedAt)
                                    const target = AGING_TARGET_SECONDS[barrel.capacity] ?? 365 * 86400
                                    const progress = agingSeconds / target
                                    const deliveryFee = BARREL_DELIVERY_FEES[barrel.capacity] ?? 0

                                    return (
                                        <div
                                            key={barrel.id}
                                            className="rounded-xl border border-border/60 bg-card p-5 space-y-4 hover:border-amber-500/30 transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex gap-3">
                                                    <BarrelVisual
                                                        capacity={barrel.capacity}
                                                        progress={progress}
                                                        isAging={isAging}
                                                        isDone={isDone}
                                                    />
                                                    <div>
                                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-mono text-[10px]">
                                                            {barrel.id}
                                                        </Badge>
                                                        <h4 className="font-display font-bold text-base text-foreground mt-1">
                                                            {barrel.capacity} Premium Oak ({spec?.woodType.split(" (")[0] || ""})
                                                        </h4>
                                                        {barrel.forSale && (
                                                            <Badge className="mt-1.5 bg-emerald-500 text-black border-none text-[10px] uppercase font-bold flex items-center gap-1 w-fit">
                                                                <Tag className="w-3 h-3" />
                                                                판매중 · {barrel.currentValueZp.toLocaleString()} ZP
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-amber-500 text-black border-none text-[10px] uppercase font-bold whitespace-nowrap">
                                                    {barrel.status === "ordered" ? "보관 대기 (Ordered)" : barrel.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border/40 py-3 my-2">
                                                <div>
                                                    <span className="text-muted-foreground block">봉인 현황</span>
                                                    <span className="font-semibold text-emerald-500">{barrel.sealStatus}</span>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Timer className="w-3 h-3" /> 누적 숙성 시간 {isAging && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                    </span>
                                                    <span className="font-mono font-semibold text-foreground text-[11px]">
                                                        {formatAgingDuration(agingSeconds)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">디지털 증명서 번호</span>
                                                    <span className="font-mono text-foreground">{barrel.certNumber}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">시작일</span>
                                                    <span className="font-mono text-foreground">
                                                        {barrel.productionDate ? new Date(barrel.productionDate._seconds * 1000).toLocaleDateString() : "-"}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <span className="text-muted-foreground block">현재 시세 (자동 산정)</span>
                                                    <span className="font-mono font-bold text-amber-500">
                                                        {barrel.currentValueZp.toLocaleString()} ZP
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-[11px] h-8 bg-zinc-900 border-border/60 text-zinc-300 hover:text-white"
                                                    onClick={() => setActiveCertBarrel(barrel)}
                                                >
                                                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                                                    디지털 인증서
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-[11px] h-8 bg-zinc-900 border-border/60 text-zinc-300 hover:text-white"
                                                    onClick={() => setActiveQrBarrel(barrel)}
                                                >
                                                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                                                    QR 실시간 정보
                                                </Button>

                                                {!barrel.forSale && barrel.status === "ordered" && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "room_aging")}
                                                        >
                                                            위탁 숙성 시작
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "deliver")}
                                                        >
                                                            직접 배송 신청 ({deliveryFee.toLocaleString()} ZP)
                                                        </Button>
                                                    </>
                                                )}

                                                {!barrel.forSale && barrel.status.includes("숙성 중") && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "bottle")}
                                                        >
                                                            병입 서비스 신청
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-[11px] h-8 border-border/60 text-zinc-300"
                                                            onClick={() => handleBarrelAction(barrel.id, "extend_aging")}
                                                        >
                                                            에이징 연장
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "deliver")}
                                                        >
                                                            직접 배송 신청 ({deliveryFee.toLocaleString()} ZP)
                                                        </Button>
                                                    </>
                                                )}

                                                {!isDone && (
                                                    barrel.forSale ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-[11px] h-8 border-red-500/40 text-red-400 hover:text-red-300"
                                                            onClick={() => handleCancelSale(barrel.id)}
                                                        >
                                                            판매 등록 취소
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1 text-[11px] h-8 border-emerald-500/40 text-emerald-400 hover:text-emerald-300"
                                                            disabled={actionBusy}
                                                            onClick={() => handleListForSale(barrel.id, barrel.currentValueZp)}
                                                        >
                                                            <Tag className="w-3.5 h-3.5" />
                                                            현재 시세로 판매 등록
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Public Barrel Gallery — visible to all members, incl. marketplace listings */}
                {errorProfile !== "로그인이 필요합니다." && (
                    <section className="space-y-6">
                        <div className="border-b border-border/60 pb-3">
                            <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Users className="w-5 h-5 text-amber-500" />
                                전체 회원 배럴 갤러리 (Public Collection)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                젠타로 전 회원이 보유한 배럴을 함께 둘러보세요. 판매 등록된 배럴은 ZP로 바로 구매하실 수 있습니다.
                            </p>
                        </div>

                        {galleryLoading ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                불러오는 중...
                            </div>
                        ) : publicBarrels.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                아직 등록된 배럴이 없습니다.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {publicBarrels.map((pb) => {
                                    const isDone = pb.status === "직접 배송 완료" || pb.status === "병입 완료 및 출고"
                                    const isAging = !isDone
                                    const agingSeconds = agingSecondsFor(pb.productionDate, pb.agingEndedAt)
                                    const target = AGING_TARGET_SECONDS[pb.capacity] ?? 365 * 86400
                                    const progress = agingSeconds / target
                                    const isMine = pb.ownerId === myUid

                                    return (
                                        <div
                                            key={pb.id}
                                            className="rounded-xl border border-border/60 bg-card p-4 space-y-3 hover:border-amber-500/30 transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-3">
                                                <BarrelVisual
                                                    capacity={pb.capacity}
                                                    progress={progress}
                                                    isAging={isAging}
                                                    isDone={isDone}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-mono text-[9px]">
                                                        {pb.id}
                                                    </Badge>
                                                    <p className="text-xs font-semibold text-foreground mt-1 truncate">
                                                        {pb.ownerLabel} {isMine && <span className="text-amber-500">(나)</span>}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {formatAgingDuration(agingSeconds)} 숙성 중
                                                    </p>
                                                    <Badge className="mt-1 bg-amber-500/90 text-black border-none text-[9px] font-bold">
                                                        {pb.status === "ordered" ? "보관 대기" : pb.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-center text-muted-foreground">
                                                현재 시세 <span className="font-mono font-bold text-amber-500">{pb.currentValueZp.toLocaleString()} ZP</span>
                                            </div>

                                            {pb.forSale ? (
                                                isMine ? (
                                                    <div className="text-[10px] text-emerald-400 border border-emerald-500/20 rounded px-2 py-1.5 text-center">
                                                        내 배럴 · 판매중
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="w-full text-[11px] h-8 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold flex items-center justify-center gap-1"
                                                        disabled={actionBusy}
                                                        onClick={() => handleBuyBarrel(pb)}
                                                    >
                                                        <ShoppingCart className="w-3.5 h-3.5" />
                                                        구매하기
                                                    </Button>
                                                )
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground text-center py-1.5">
                                                    비매물
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Order Process Section */}
                <section className="space-y-6">
                    <div className="border-b border-border/60 pb-3">
                        <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                            <Layers className="w-5 h-5 text-amber-500" />
                            배럴 주문 프로세스 (Order Process)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            에이징 단계부터 보증서 보관까지 이어지는 체계적인 스피릿 메이킹 단계를 확인해 보세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 1 & 2</div>
                            <h4 className="font-semibold text-sm text-foreground">배럴 스펙 선택 및 소유 요건 검토</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                회원이 원하는 배럴 용량을 정하면, 시스템이 지갑 속 ZTRO 스테이킹 누적치 및 <span className="notranslate">EXP</span> 보유액을 실시간 조회 후 검증합니다.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 3 & 4</div>
                            <h4 className="font-semibold text-sm text-foreground">주문 승인 및 마스터 원주 충전</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                자격 검증이 통과되면 오프체인 <span className="notranslate">EXP</span>가 자동 차감되며, 젠타로 주류원에서 수작업 오크통에 원주 주입 과정을 셋업합니다.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 5 & 6</div>
                            <h4 className="font-semibold text-sm text-foreground">공식 봉인 및 디지털 보증서 발급</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                안심 타임스탬프 밴드 봉인을 부착하고 고유 QR 코드를 매핑하여, 회원의 소유 등기 증명서 발급 및 라이프사이클 관리를 시작합니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Oak barrel Toasting & Charring Technology Section */}
                <section className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <h3 className="font-display text-xl font-bold flex items-center justify-center gap-2 text-foreground">
                            <Flame className="w-5 h-5 text-red-500" />
                            ZenTaro Signature Oak Barrel Technology
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                            오크의 종류와 열처리 차링 레벨을 입체적으로 가공하여 자연 그대로의 깊고 은은한 시그니처 마스터 노트를 완성합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {FLAVORS.map((flavor) => (
                            <div
                                key={flavor.name}
                                className="p-4 rounded-lg border border-border/50 bg-card hover:border-amber-500/30 transition-all duration-300 hover:translate-y-[-2px] group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-130 transition-transform" />
                                    <span className="font-display font-semibold text-foreground text-sm group-hover:text-amber-500 transition-colors">
                                        {flavor.name}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                                    {flavor.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-lg bg-zinc-900/50 border border-border/40 text-center font-display text-xs sm:text-sm text-foreground/80 italic">
                        &ldquo; ZenTaro는 단순히 술을 담는 오크통이 아닌, 풍미를 설계하는 오크통을 설계합니다. &rdquo;
                    </div>
                </section>

                {/* Timestamp Seal Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-5">
                        <h3 className="font-display text-xl font-bold flex items-center gap-2 text-foreground">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Timestamp Seal & 위조방지 봉인
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            모든 배럴은 젠타로 주류원에서 오크 충전 즉시 물리적 충격 시 표시가 선명히 남는
                            <strong> 변조 방지 타임스탬프 봉인(Timestamp Seal)</strong>으로 강력히 잠금 처리됩니다.
                        </p>
                        <div className="space-y-3">
                            <div className="flex gap-3 text-xs">
                                <span className="font-mono font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded h-fit">
                                    보호항목
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    배럴 고유번호 · 최초 충입일 · 숙성 시작일 · 소유자 오프체인 정보 · 고유 디지털 QR 인증 코드
                                </p>
                            </div>
                            <div className="flex gap-3 text-xs">
                                <span className="font-mono font-bold text-red-500 bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded h-fit">
                                    안전조건
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    배럴 봉인이 유지된 상태에서만 공인 에이징 이력이 공식 적치되며, 임의 개봉 시 이력 체인이 자동 소멸 처리됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/60 p-4 rounded-xl space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                                ZenTaro Barrel Room 관리 환경
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                연중 항온항습(온도 15~18°C, 습도 60~70%) 최적 스펙 시스템이 가동되는 젠타로 증류소 직영 Barrel Room에서 안전하게 숙성됩니다.
                                언제든 디지털 증명서 조회를 통해 숙성 연수 및 온도 변화를 원격 상태로 추적할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* Timestamp Seal graphic mockup */}
                    <div className="border border-border/60 bg-card rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="font-display font-semibold text-base text-foreground">공식 타임스탬프 봉인 보호 구조</h4>
                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                            배럴 주문이 완료되면 디지털 봉인 증서가 블록 매핑 데이터베이스에 자동 등재되며, QR 판독을 통해 오프라인 오크 배럴에 수작업 인쇄된 엠블럼 실물의 무결성을 실시간 검증합니다.
                        </p>
                        <div className="w-full bg-background border border-border/60 p-3 rounded-lg flex items-center justify-between text-left text-[10px]">
                            <div>
                                <span className="text-muted-foreground block">무결성 상태 :</span>
                                <span className="text-emerald-500 font-bold">SECURED (안전)</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-right">보증 등기 체인 :</span>
                                <span className="text-foreground font-mono block text-right">ACTIVE ON-CHAIN COUPLING</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Member Services Map (Timeline / Process View) */}
                <section className="space-y-6">
                    <div className="text-center max-w-md mx-auto space-y-2">
                        <h3 className="font-display text-xl font-bold flex items-center justify-center gap-2 text-foreground">
                            <Layers className="w-5 h-5 text-amber-500" />
                            Premium Member Services
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            지정 오크통 분양 시 배럴 클럽 회원권과 함께 제공되는 핵심 리저브 전용 기능들입니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <MapPin className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ① Barrel Room 위탁 숙성
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    개인 관리의 부담 없이 온도·습도·진동이 엄격히 설계된 공식 배럴 저장실에 안전하게 장기 적치합니다.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <History className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ② 소유권 이전 및 판매
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    보유 중인 배럴의 지분을 젠타로 회원 간 간편히 모바일로 양도/판매하실 수 있으며 내역은 영구 등기 로그됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <Truck className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ③ 직접 배송 서비스
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    원하시는 시점에 소유자의 자택/매장으로 배럴 전체를 밀봉 그대로 직송해 드려 오리지널리티를 보증합니다.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <FileText className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ④ 병입 (Bottling) & 레이블
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    숙성을 마친 원주의 병입을 신청하시면 캔들 필터링, 하이 볼륨 병입, 그리고 프리미엄 소유 인장을 라벨 부착 지원합니다.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Philosophy and Core Values */}
                <section className="rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-amber-500/20 py-12 px-6 text-center space-y-6 relative overflow-hidden">
                    <div className="space-y-2">
                        <span className="text-xs uppercase tracking-widest text-amber-500/80 font-mono">
                            ZenTaro Philosophy
                        </span>
                        <blockquote className="font-display text-lg sm:text-xl font-medium text-foreground tracking-wide italic leading-relaxed">
                            &ldquo; One Barrel. One Owner. One Legacy. &rdquo;
                        </blockquote>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-xs text-zinc-400 font-mono">
                        <span>Stake. Age. Own.</span>
                        <span className="hidden sm:inline text-amber-500/30">|</span>
                        <span>One Barrel. One Owner. One Legacy.</span>
                    </div>

                    <div className="pt-4 max-w-sm mx-auto">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            숙성은 긴 여정입니다. 하나의 에이징 배럴 속에는 단순히 정밀 증류된 알코올이 남아있는 것이 아닙니다.
                            세월이 빚어낸 오크 향조와 우리들의 이야지가 함께 고스란히 담깁니다.
                        </p>
                    </div>
                </section>

            </div>

            {/* DIGITAL OWNERSHIP CERTIFICATE MODAL */}
            {activeCertBarrel && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-mono max-w-md w-full scrollbar-none max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm"
                            onClick={() => setActiveCertBarrel(null)}
                        >
                            닫기 [✕]
                        </button>
                        <div className="absolute top-4 right-14 w-10 h-10 rounded-full border border-amber-500/30 flex items-center justify-center pointer-events-none">
                            <Award className="w-5 h-5 text-amber-500" />
                        </div>

                        <div className="border-b border-amber-500/20 pb-4 mb-4 mt-2">
                            <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-sans">
                                Digital Ownership
                            </span>
                            <h4 className="text-base font-bold text-foreground mt-1 font-sans">
                                DIGITAL BARREL CERTIFICATE
                            </h4>
                        </div>

                        <div className="space-y-2.5 text-xs text-zinc-300">
                            <div className="flex justify-between">
                                <span>BARREL ID</span>
                                <span className="text-white font-bold">{activeCertBarrel.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>OWNER UID</span>
                                <span className="text-white select-all">{activeCertBarrel.userId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>CAPACITY</span>
                                <span className="text-white">{activeCertBarrel.capacity} (리저브 배럴)</span>
                            </div>
                            <div className="flex justify-between">
                                <span>PRODUCTION DATE</span>
                                <span className="text-white">
                                    {activeCertBarrel.productionDate ? new Date(activeCertBarrel.productionDate._seconds * 1000).toLocaleDateString() : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>CUMULATIVE AGING</span>
                                <span className="text-white font-mono text-[10px]">
                                    {formatAgingDuration(agingSecondsFor(activeCertBarrel.productionDate, activeCertBarrel.agingEndedAt))}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>AGING STATE</span>
                                <span className="text-emerald-500 font-bold block animate-pulse">{activeCertBarrel.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SEAL STATUS</span>
                                <span className="text-emerald-500">{activeCertBarrel.sealStatus}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>CERTIFICATE NUMBER</span>
                                <span className="text-amber-500 font-bold">{activeCertBarrel.certNumber}</span>
                            </div>
                        </div>

                        <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-2">
                            <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                                Ownership History 로그
                            </span>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-[10px] text-zinc-400">
                                {activeCertBarrel.ownershipHistory?.map((entry, idx) => (
                                    <div key={idx} className="border-l border-amber-500/30 pl-2 py-0.5 space-y-0.5">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-zinc-300">{entry.action.toUpperCase()}</span>
                                            <span>{new Date(entry.date).toLocaleString()}</span>
                                        </div>
                                        {entry.message && <p className="text-[9px] text-muted-foreground">{entry.message}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-amber-500/20 pt-4 mt-4 flex items-center justify-between">
                            <div className="w-12 h-12 bg-white flex items-center justify-center p-1 rounded">
                                <QrCode className="w-full h-full text-black" />
                            </div>
                            <span className="text-[9px] text-zinc-400 text-right font-sans leading-normal max-w-xs">
                                QR 인증 코드 발급 완료: {activeCertBarrel.qrKey}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* QR SIL TIME SIMULATOR MODAL */}
            {activeQrBarrel && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-border/40 pb-3">
                            <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-1.5">
                                <QrCode className="w-5 h-5 text-amber-500" />
                                QR 실시간 스캔 정보
                            </h3>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground text-xs"
                                onClick={() => setActiveQrBarrel(null)}
                            >
                                닫기 ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-muted-foreground">
                            <p className="text-center font-mono text-[10px] bg-background p-2 rounded border border-border/40 text-foreground">
                                https://zentaro.netlify.app/verify/barrel?key={activeQrBarrel.qrKey}
                            </p>

                            <div className="space-y-2 divide-y divide-border/20 pt-1">
                                <div className="flex justify-between py-1.5">
                                    <span>배럴 ID :</span>
                                    <span className="text-foreground font-mono font-semibold">{activeQrBarrel.id}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>현재 소유자 UID :</span>
                                    <span className="text-foreground font-mono truncate max-w-40">{activeQrBarrel.userId}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>누적 숙성 시간 :</span>
                                    <span className="text-foreground font-mono font-semibold text-[10px]">
                                        {formatAgingDuration(agingSecondsFor(activeQrBarrel.productionDate, activeQrBarrel.agingEndedAt))}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>현재 배럴 상태 :</span>
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                                        {activeQrBarrel.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>Timestamp Seal :</span>
                                    <Badge className="bg-emerald-500 text-black border-none text-[10px] font-bold">
                                        {activeQrBarrel.sealStatus}
                                    </Badge>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>배송 완료 여부 :</span>
                                    <span className="text-foreground">
                                        {activeQrBarrel.status.includes("배송") ? "배송 완료" : "Barrel Room 위탁 보관 중"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-amber-500 leading-normal">
                            💡 실물 배럴에 부착된 홀로그램 QR 코드를 스마트폰 카메라로 스캔하면 이와 동일한 무결성 정보 검증 웹화면으로 자동 연동 조회됩니다.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
