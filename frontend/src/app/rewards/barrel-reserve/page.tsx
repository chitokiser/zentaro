"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    Locate
} from "lucide-react"

interface BarrelSpec {
    size: string
    label: string
    capacity: string
    agingPeriod: string
    recommendedSpirit: string
    expRequirement: string
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
        expRequirement: "누적 10,000 EXP 이상 보유 회원 신청 가능",
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
        expRequirement: "누적 30,000 EXP 이상 보유 회원 신청 가능",
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
        expRequirement: "누적 70,000 EXP 이상 보유 회원 신청 가능",
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
        expRequirement: "누적 150,000 EXP 이상 보유 회원 신청 가능",
        dimensions: "52cm x 38cm x 38cm",
        woodType: "Ex-Bourbon White Oak Barrel",
        description: "최고의 마스터피스를 추구하는 VVIP 리저브 용량입니다. 최고의 밸런스를 유도하기 위한 중-장기 숙성에 최적화되어 있으며, 젠타로 배럴룸의 가장 안정적인 구역에서 철저하게 관리됩니다."
    }
]

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
    const [selectedSize, setSelectedSize] = useState<string>("10L")
    const currentSpec = BARREL_SPECS.find(spec => spec.size === selectedSize) || BARREL_SPECS[1]

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                eyebrow="서비스"
                title="ZenTaro Barrel Reserve"
                description="EXP 회원 전용 프리미엄 배럴 프로그램 — 시간을 소유하는 사람들을 위한 특별한 경험"
            />

            <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">

                {/* Intro Section */}
                <section className="text-center max-w-3xl mx-auto space-y-4">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 px-3 py-1 bg-amber-500/5">
                        EXP EXCLUSIVE MEMBERSHIP
                    </Badge>
                    <h2 className="font-display text-2xl font-bold sm:text-3xl text-foreground">
                        시간이 빚어내는 궁극의 오리지널 풍미
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        ZenTaro Barrel Reserve는 단순히 술을 구매하는 프로그램이 아닙니다.
                        회원은 ZenTaro 주류원(Distillery)이 직접 증류한 최상급 중성주와 원주를 엄선된 프리미엄 오크 배럴에 담아,
                        프라이빗 숙성 환경 속에서 시간이 더해가는 무한한 가치를 직접 설계하고 공유하게 됩니다.
                    </p>
                </section>

                {/* Premium Oak Barrel Selection Area */}
                <section className="space-y-6">
                    <div className="border-b border-border/60 pb-3">
                        <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                            <Wine className="w-5 h-5 text-amber-500" />
                            Premium Oak Barrel 프리미엄 배럴 선택
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            EXP 등급에 비례하여 크기를 선택할 수 있으며, 배럴마다 고유 디지털 인증 키카 발급되어 개별 위탁 관리됩니다.
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
                                        <Badge variant="secondary" className="font-mono text-xs font-bold">
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

                                {/* Visual wood fiber decoration */}
                                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                                    <Wine className="w-20 h-20 transform translate-x-4 translate-y-4" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Interactive Specification View */}
                    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                                        Active Specification Selection
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        ID Prefix: ZT-REV-{currentSpec.size}-REV
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
                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        EXP Membership Limit
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        본 배럴은 정밀한 제작 및 수작업 한정 수량 공정 특성상 아래의 등급 자격 요건을 충족하는 회원에 한하여 지급 신청이 가능합니다.
                                    </p>
                                </div>
                                <div className="bg-card p-3 rounded border border-amber-500/10 text-xs">
                                    <span className="text-amber-500 font-medium font-mono block">
                                        {currentSpec.expRequirement}
                                    </span>
                                </div>
                                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs py-2 shadow">
                                    배럴 상담 신청하기
                                </Button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Toasting & Charring Technology Section */}
                <section className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <h3 className="font-display text-xl font-bold flex items-center justify-center gap-2">
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

                {/* Timestamp Seal Details & Certificate Mockup */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    <div className="space-y-5">
                        <h3 className="font-display text-xl font-bold flex items-center gap-2">
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
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                ZenTaro Barrel Room 관리 환경
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                연중 항온항습(온도 15~18°C, 습도 60~70%) 최적 스펙 시스템이 가동되는 젠타로 증류소 직영 Barrel Room에서 안전하게 숙성됩니다.
                                언제든 디지털 증명서 조회를 통해 숙성 연수 및 온도 변화를 원격 상태로 추적할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* Certificate design card */}
                    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden font-mono max-w-sm mx-auto w-full">
                        {/* Holographic badge element */}
                        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-20 blur-sm pointer-events-none" />
                        <div className="absolute top-4 right-4 w-12 h-12 rounded-full border border-amber-500/40 flex items-center justify-center pointer-events-none">
                            <Award className="w-6 h-6 text-amber-500/80" />
                        </div>

                        <div className="border-b border-amber-500/20 pb-4 mb-4">
                            <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-sans">
                                Digital Ownership
                            </span>
                            <h4 className="text-sm font-bold text-foreground mt-1 font-sans">
                                BARREL RESERVED CERTIFICATE
                            </h4>
                        </div>

                        <div className="space-y-2 text-[10px] text-zinc-300">
                            <div className="flex justify-between">
                                <span>BARREL ID</span>
                                <span className="text-white font-bold">ZT-REV-10L-00892</span>
                            </div>
                            <div className="flex justify-between">
                                <span>OWNER NAME</span>
                                <span className="text-white">ZIPUP_MEMBERSHIP_01</span>
                            </div>
                            <div className="flex justify-between">
                                <span>CAPACITY</span>
                                <span className="text-white">10.0 Liters</span>
                            </div>
                            <div className="flex justify-between">
                                <span>PRODUCTION DATE</span>
                                <span className="text-white">2026-07-22</span>
                            </div>
                            <div className="flex justify-between">
                                <span>AGING STATE</span>
                                <span className="text-emerald-500 font-bold block animate-pulse">Aging [ACTIVE]</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SEAL INTEGRITY</span>
                                <span className="text-emerald-500">SECURED (GOOD)</span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
                                <span>CERTIFICATE KEY</span>
                                <span className="text-amber-500 text-[9px]">40cf8-f8a1-d82b-0aa1</span>
                            </div>
                        </div>

                        <div className="border-t border-amber-500/20 pt-4 mt-4 flex items-center justify-between">
                            <div className="w-12 h-12 bg-white flex items-center justify-center p-1 rounded">
                                {/* Simulating QR code graphic */}
                                <div className="w-full h-full bg-zinc-950 flex flex-wrap justify-between p-0.5">
                                    <div className="w-4 h-4 bg-white" />
                                    <div className="w-4 h-4 bg-white" />
                                    <div className="w-4 h-4 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                </div>
                            </div>
                            <span className="text-[8px] text-zinc-400 text-right font-sans leading-normal">
                                QR 스캔 시 실시간 위탁 숙성 이력 검증 시스템 연계
                            </span>
                        </div>
                    </div>

                </section>

                {/* Member Services Map (Timeline / Process View) */}
                <section className="space-y-6">
                    <div className="text-center max-w-md mx-auto space-y-2">
                        <h3 className="font-display text-xl font-bold flex items-center justify-center gap-2">
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
                            &ldquo; One Barrel. One Owner. One Story. &rdquo;
                        </blockquote>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-xs text-zinc-400 font-mono">
                        <span>Fire Shapes the Barrel.</span>
                        <span className="hidden sm:inline text-amber-500/30">|</span>
                        <span>Time Creates the Spirit.</span>
                        <span className="hidden sm:inline text-amber-500/30">|</span>
                        <span>ZenTaro Creates the Legacy.</span>
                    </div>

                    <div className="pt-4 max-w-sm mx-auto">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            숙성은 긴 여정입니다. 하나의 에이징 배럴 속에는 단순히 정밀 증류된 알코올이 남아있는 것이 아닙니다.
                            세월이 빚어낸 오크 향조와 우리들의 이야기가 함께 고스란히 담깁니다.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    )
}
