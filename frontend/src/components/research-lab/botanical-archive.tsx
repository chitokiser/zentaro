"use client"

import { useState, useMemo, useEffect, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, FlaskConical, Leaf, Sparkles, Beaker, FlaskRound, SlidersHorizontal, Search, ExternalLink } from "lucide-react"
import { getToken, onAuthChanged } from "@/lib/auth-client"
import { useWikipediaThumbnail } from "@/lib/wikipedia-thumbnail"
import { MemberFeatureLock } from "@/components/research-lab/member-feature-lock"
import { BotanicalCard } from "@/components/research-lab/botanical-card"
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

export interface Botanical {
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

function chart(citrus: number, spicy: number, floral: number, earthy: number, sweet: number): FlavorChartPoint[] {
    return [
        { subject: "Citrus", A: citrus, fullMark: 100 },
        { subject: "Spicy", A: spicy, fullMark: 100 },
        { subject: "Floral", A: floral, fullMark: 100 },
        { subject: "Earthy", A: earthy, fullMark: 100 },
        { subject: "Sweet", A: sweet, fullMark: 100 },
    ]
}

/** Simple average of each selected botanical's 5-axis chart — an illustrative
 * blend preview, not the dose/extraction-aware engine in the AI Virtual
 * Research Lab section below. */
function computeMixChart(selection: Botanical[]): FlavorChartPoint[] {
    const subjects = ["Citrus", "Spicy", "Floral", "Earthy", "Sweet"]
    return subjects.map((subject) => {
        const values = selection.map((b) => b.flavorChart.find((p) => p.subject === subject)?.A ?? 0)
        const avg = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
        return { subject, A: Math.round(avg), fullMark: 100 }
    })
}

const AXES = ["Citrus", "Spicy", "Floral", "Earthy", "Sweet"] as const
type Axis = (typeof AXES)[number]

interface BalanceTarget {
    sweet: number
    spicy: number
    citrus: number
    floral: number
    earthy: number
}

const DEFAULT_TARGET: BalanceTarget = { sweet: 50, spicy: 50, citrus: 50, floral: 50, earthy: 50 }

const SLIDER_DEFS: { key: keyof BalanceTarget; label: string }[] = [
    { key: "sweet", label: "단맛" },
    { key: "spicy", label: "스파이시" },
    { key: "citrus", label: "시트러스" },
    { key: "floral", label: "꽃향" },
    { key: "earthy", label: "거친 느낌" },
]

function toAxisTarget(t: BalanceTarget): Record<Axis, number> {
    return { Citrus: t.citrus, Spicy: t.spicy, Floral: t.floral, Earthy: t.earthy, Sweet: t.sweet }
}

function axisAverages(selection: Botanical[]): Record<Axis, number> {
    const result = {} as Record<Axis, number>
    for (const axis of AXES) {
        const values = selection.map((b) => b.flavorChart.find((p) => p.subject === axis)?.A ?? 0)
        result[axis] = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
    }
    return result
}

function distance(a: Record<Axis, number>, b: Record<Axis, number>): number {
    return Math.sqrt(AXES.reduce((sum, axis) => sum + (a[axis] - b[axis]) ** 2, 0))
}

/** Greedy nearest-blend search over the full archive — at each step, adds
 * whichever remaining botanical brings the running average closest to the
 * target, stopping once another pick stops meaningfully improving the fit. */
function recommendBlend(target: Record<Axis, number>, maxCount = 5): Botanical[] {
    const picked: Botanical[] = []
    for (let step = 0; step < maxCount; step++) {
        let best: Botanical | null = null
        let bestDist = Infinity
        for (const candidate of botanicalData) {
            if (picked.includes(candidate)) continue
            const dist = distance(axisAverages([...picked, candidate]), target)
            if (dist < bestDist) {
                bestDist = dist
                best = candidate
            }
        }
        if (!best) break
        const prevDist = distance(axisAverages(picked), target)
        picked.push(best)
        if (picked.length >= 2 && prevDist - bestDist < 2) break
    }
    return picked
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
        flavorChart: chart(95, 30, 20, 40, 10),
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
        flavorChart: chart(10, 85, 30, 50, 75),
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
        flavorChart: chart(5, 95, 10, 70, 60),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "증류 후반부(Tails)에 강력한 우디함을 부여합니다. 너무 늦게 컷팅하면 쓴맛이 우러나오므로 본류(Hearts) 후반부에서의 정밀한 컷팅이 요구됩니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "juniper",
        nameKo: "주니퍼베리",
        nameEn: "Juniper Berry",
        scientificName: "Juniperus communis",
        flavorProfile: {
            top: "송진 같은 청량한 파인(Pine) 향",
            mid: "쌉싸름한 수지(樹脂)감과 허브 뉘앙스",
            base: "은은한 우디함",
        },
        flavorChart: chart(20, 40, 15, 65, 15),
        extraction: "동시 증류 (Co-Distillation)",
        description:
            "진(Gin)의 정체성을 규정하는 핵심 원료로, 다른 보태니컬과 함께 포트 스틸에 넣어 함께 증류하는 동시 증류법을 사용해 향이 서로 융합되도록 합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "coriander-seed",
        nameKo: "고수씨",
        nameEn: "Coriander Seed",
        scientificName: "Coriandrum sativum",
        flavorProfile: {
            top: "레몬 껍질을 연상시키는 시트러스",
            mid: "은은한 세이지, 넛티(Nutty)한 뉘앙스",
            base: "가벼운 스파이시",
        },
        flavorChart: chart(60, 45, 20, 30, 20),
        extraction: "감압 증류 (Vacuum Distillation)",
        description:
            "낮은 압력에서 끓는점을 낮춰 저온으로 증류함으로써 열에 약한 시트러스·허브 향을 산화나 탄내 없이 그대로 보존합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "angelica-root",
        nameKo: "안젤리카 루트",
        nameEn: "Angelica Root",
        scientificName: "Angelica archangelica",
        flavorProfile: {
            top: "머스키(Musky)하고 흙 내음이 도는 향",
            mid: "셀러리와 유사한 그린(Green) 노트",
            base: "깊은 우디·루티(Rooty)함",
        },
        flavorChart: chart(15, 30, 10, 85, 25),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "다른 향들을 하나로 묶어주는 '고정제(Fixative)' 역할을 합니다. 상온에서 최소 48시간 이상 침출해 뿌리의 깊은 향을 서서히 끌어냅니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "orris-root",
        nameKo: "오리스 루트",
        nameEn: "Orris Root",
        scientificName: "Iris germanica",
        flavorProfile: {
            top: "은은한 바이올렛 플로럴",
            mid: "파우더리(Powdery)하고 부드러운 질감",
            base: "옅은 우디 잔향",
        },
        flavorChart: chart(10, 10, 70, 35, 30),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "채취 후 최소 3년을 건조·숙성시켜야 특유의 바이올렛 향이 발현되는 원료로, 진의 질감을 부드럽게 다듬는 고정제로 소량만 사용합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "lemon-peel",
        nameKo: "레몬 껍질",
        nameEn: "Lemon Peel",
        scientificName: "Citrus limon",
        flavorProfile: {
            top: "쨍하고 상쾌한 시트러스 오일",
            mid: "가벼운 산미",
            base: "옅은 왁시(Waxy)함",
        },
        flavorChart: chart(98, 5, 10, 10, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "흰 속껍질(Pith)의 쓴맛이 섞이지 않도록 겉껍질만 얇게 저며 증기 바스켓에 올려, 휘발성 오일만을 깨끗하게 포집합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "bitter-orange-peel",
        nameKo: "비터 오렌지 껍질",
        nameEn: "Bitter Orange Peel",
        scientificName: "Citrus aurantium",
        flavorProfile: {
            top: "달콤 쌉싸름한 마멀레이드 향",
            mid: "은은한 꽃향과 스파이스",
            base: "가벼운 쓴맛의 여운",
        },
        flavorChart: chart(85, 20, 25, 20, 35),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "세비야산 비터 오렌지의 말린 껍질을 사용하며, 일반 오렌지보다 정유 함량이 높아 소량으로도 뚜렷한 존재감을 남깁니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "grapefruit-peel",
        nameKo: "자몽 껍질",
        nameEn: "Grapefruit Peel",
        scientificName: "Citrus paradisi",
        flavorProfile: {
            top: "쌉쌀하고 청량한 자몽 특유의 향",
            mid: "산뜻한 산미",
            base: "옅은 씁쓸함",
        },
        flavorChart: chart(90, 10, 10, 15, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "노멀린(Nootkatone) 성분이 자몽 특유의 쌉쌀한 개성을 만들어내며, 저온 증기 주입으로 이 휘발성 향을 최대한 살립니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "bergamot-peel",
        nameKo: "베르가못 껍질",
        nameEn: "Bergamot Peel",
        scientificName: "Citrus bergamia",
        flavorProfile: {
            top: "얼그레이 홍차를 연상시키는 우아한 시트러스",
            mid: "가벼운 플로럴 뉘앙스",
            base: "은은한 티(Tea) 향의 잔향",
        },
        flavorChart: chart(80, 10, 35, 15, 20),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "이탈리아 칼라브리아산 베르가못의 껍질만을 냉압착해 얻은 오일을 소량 블렌딩해, 홍차향을 닮은 고급스러운 시트러스 레이어를 더합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "yuzu-peel",
        nameKo: "유자 껍질",
        nameEn: "Yuzu Peel",
        scientificName: "Citrus junos",
        flavorProfile: {
            top: "화사하고 산뜻한 동양적 시트러스",
            mid: "은은한 꽃향",
            base: "가벼운 산미의 여운",
        },
        flavorChart: chart(92, 10, 25, 10, 20),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "국내산 유자 껍질을 저온에서 침출해 열로 인한 향 손실 없이 유자 특유의 화사한 시트러스와 은은한 단맛을 그대로 옮겨 담습니다.",
        relatedProduct: "ZENTARO Yuzu Gin",
    },
    {
        id: "kaffir-lime-leaf",
        nameKo: "카피르 라임 잎",
        nameEn: "Kaffir Lime Leaf",
        scientificName: "Citrus hystrix",
        flavorProfile: {
            top: "강렬한 라임과 그린 허브향",
            mid: "톡 쏘는 시트로넬라 뉘앙스",
            base: "깨끗하고 산뜻한 잔향",
        },
        flavorChart: chart(88, 15, 20, 25, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "잎을 가볍게 비벼 세포벽을 터뜨린 뒤 증기 바스켓에 올려, 열대 동남아 요리에서 익숙한 강렬한 라임 그린 향을 진에 이식합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "green-cardamom",
        nameKo: "그린 카다멈",
        nameEn: "Green Cardamom",
        scientificName: "Elettaria cardamomum",
        flavorProfile: {
            top: "화한 유칼립투스 같은 청량감",
            mid: "달콤하고 은은한 스파이스",
            base: "따뜻한 여운",
        },
        flavorChart: chart(25, 70, 15, 30, 40),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "'스파이스의 여왕'이라 불리는 원료로, 씨앗을 가볍게 으깬 뒤 침출해야 씨앗을 감싼 캡슐 안의 정유가 온전히 우러나옵니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "licorice-root",
        nameKo: "감초",
        nameEn: "Licorice Root",
        scientificName: "Glycyrrhiza glabra",
        flavorProfile: {
            top: "은은하고 부드러운 단맛",
            mid: "아니스를 닮은 허브향",
            base: "묵직하고 오래가는 단맛의 잔향",
        },
        flavorChart: chart(5, 45, 10, 60, 90),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "설탕보다 수십 배 단맛을 내는 글리시리진 성분 덕분에 당분 첨가 없이도 자연스러운 단맛과 무게감을 술에 더할 수 있습니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "fennel-seed",
        nameKo: "펜넬씨",
        nameEn: "Fennel Seed",
        scientificName: "Foeniculum vulgare",
        flavorProfile: {
            top: "달콤한 아니스향과 상쾌함",
            mid: "은은한 허브 그린 노트",
            base: "가벼운 스파이시 여운",
        },
        flavorChart: chart(15, 55, 15, 35, 35),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "씨앗을 살짝 로스팅한 뒤 침출하면 생씨앗보다 향이 더 진하고 견과류 같은 뉘앙스가 살아나, 팔각·아니스 계열 원료와 균형을 맞추기 좋습니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "anise-seed",
        nameKo: "아니스씨",
        nameEn: "Anise Seed",
        scientificName: "Pimpinella anisum",
        flavorProfile: {
            top: "선명하고 달콤한 리코리스향",
            mid: "따뜻한 스파이스",
            base: "긴 여운의 단맛",
        },
        flavorChart: chart(10, 60, 15, 40, 65),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "아네톨(Anethole) 함량이 높아 팔각과 유사한 향을 내지만 보다 가볍고 산뜻해, 무거운 스파이스 원료의 균형을 잡는 용도로 소량 사용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "cubeb-pepper",
        nameKo: "큐베브 페퍼",
        nameEn: "Cubeb Pepper",
        scientificName: "Piper cubeba",
        flavorProfile: {
            top: "후추의 매콤함과 우디한 향",
            mid: "은은한 유칼립투스 뉘앙스",
            base: "가벼운 쓴맛의 여운",
        },
        flavorChart: chart(15, 75, 15, 45, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "'꼬리 후추'라는 별명대로 열매에 작은 꼬리가 달려 있으며, 일반 후추보다 은은하고 복합적인 스파이시함을 더해 진의 피니시를 길게 만듭니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "grains-of-paradise",
        nameKo: "천국의 씨앗",
        nameEn: "Grains of Paradise",
        scientificName: "Aframomum melegueta",
        flavorProfile: {
            top: "화하고 톡 쏘는 스파이시함",
            mid: "생강과 후추가 섞인 듯한 열감",
            base: "긴 매콤한 여운",
        },
        flavorChart: chart(10, 90, 10, 30, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "서아프리카 원산의 카다멈과 친척인 씨앗으로, 혀끝에서 화한 열감이 오래 지속되어 진의 피니시에 스파이시한 킥을 부여할 때 사용합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "black-pepper",
        nameKo: "블랙 페퍼",
        nameEn: "Black Pepper",
        scientificName: "Piper nigrum",
        flavorProfile: {
            top: "톡 쏘는 후추 향",
            mid: "따뜻한 스파이시함",
            base: "은은한 우디함",
        },
        flavorChart: chart(10, 88, 5, 40, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "통후추를 굵게 파쇄해 침출 직전에 넣어야 휘발성 피페린 향이 산화되지 않고 온전히 유지되어 날카로운 스파이시함을 낼 수 있습니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "pink-peppercorn",
        nameKo: "핑크 페퍼콘",
        nameEn: "Pink Peppercorn",
        scientificName: "Schinus terebinthifolius",
        flavorProfile: {
            top: "달콤하고 화사한 베리향",
            mid: "가벼운 스파이시함",
            base: "은은한 파인(Pine) 노트",
        },
        flavorChart: chart(30, 55, 30, 20, 40),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "후추과가 아닌 옻나무과 열매로, 매운맛보다 달콤한 베리향이 두드러져 꽃 계열 원료와 함께 쓰면 화사한 인상을 더할 수 있습니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "sichuan-pepper",
        nameKo: "산초",
        nameEn: "Sichuan Pepper",
        scientificName: "Zanthoxylum simulans",
        flavorProfile: {
            top: "시트러스 같은 향과 알싸함",
            mid: "혀를 저릿하게 하는 마화(麻花) 감각",
            base: "은은한 우디함",
        },
        flavorChart: chart(35, 80, 10, 35, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "매운맛이 아닌 '마비되는 저릿함(Numbing)'이 특징인 향신료로, 극소량만 사용해도 피니시에 독특한 질감의 여운을 남깁니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "ginger",
        nameKo: "생강",
        nameEn: "Ginger",
        scientificName: "Zingiber officinale",
        flavorProfile: {
            top: "화한 매콤함과 상쾌함",
            mid: "따뜻한 스파이스",
            base: "은은한 단맛의 여운",
        },
        flavorChart: chart(30, 75, 5, 45, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "생뿌리를 얇게 저며 침출하면 화한 진저롤 향이, 건조 생강을 쓰면 보다 묵직하고 매운 쇼가올 향이 우러나 원하는 강도에 따라 형태를 달리합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "turmeric",
        nameKo: "강황",
        nameEn: "Turmeric",
        scientificName: "Curcuma longa",
        flavorProfile: {
            top: "흙내음과 은은한 쓴맛",
            mid: "머스키하고 우디한 향",
            base: "따뜻한 스파이시 여운",
        },
        flavorChart: chart(10, 55, 5, 80, 15),
        extraction: "저온 진공 추출 (Low-Temp Vacuum Extraction)",
        description:
            "커큐민 색소가 열에 약해 고온 증류 시 텁텁한 쓴맛이 강해지므로, 저온 진공 환경에서 짧게 추출해 색과 향의 균형을 맞춥니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "galangal",
        nameKo: "갈랑갈",
        nameEn: "Galangal",
        scientificName: "Alpinia galanga",
        flavorProfile: {
            top: "생강보다 날카롭고 송진 같은 향",
            mid: "은은한 시트러스 뉘앙스",
            base: "매콤하고 우디한 여운",
        },
        flavorChart: chart(30, 70, 5, 55, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "생강의 사촌 격이지만 훨씬 날카롭고 소나무 같은 향이 특징으로, 동남아 요리에서 자주 쓰이는 뿌리를 얇게 저며 침출합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "nutmeg",
        nameKo: "육두구",
        nameEn: "Nutmeg",
        scientificName: "Myristica fragrans",
        flavorProfile: {
            top: "따뜻하고 달콤한 스파이스향",
            mid: "은은한 우디·너티(Nutty)함",
            base: "깊고 오래가는 여운",
        },
        flavorChart: chart(10, 65, 10, 55, 55),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "씨앗을 사용 직전에 강판에 갈아야 휘발성 미리스티신 향이 최대로 발현되며, 과량 사용 시 쓴맛이 강해지므로 극소량만 배합합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "clove",
        nameKo: "정향",
        nameEn: "Clove",
        scientificName: "Syzygium aromaticum",
        flavorProfile: {
            top: "강렬하고 따뜻한 스파이스향",
            mid: "은은한 단맛과 우디함",
            base: "묵직하고 긴 여운",
        },
        flavorChart: chart(5, 85, 10, 55, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "오이게놀 함량이 매우 높아 극소량만으로도 향이 지배적이므로, 전체 보태니컬 배합비에서 가장 적은 비중으로 신중하게 사용합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "allspice",
        nameKo: "올스파이스",
        nameEn: "Allspice",
        scientificName: "Pimenta dioica",
        flavorProfile: {
            top: "계피·정향·육두구가 섞인 듯한 복합향",
            mid: "따뜻하고 달콤한 스파이스",
            base: "은은한 페퍼리(Peppery)함",
        },
        flavorChart: chart(10, 70, 10, 50, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "이름 그대로 여러 스파이스의 향을 동시에 지니고 있어, 복잡한 스파이스 블렌드를 단일 원료로 단순화하고 싶을 때 요긴하게 씁니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "vanilla-bean",
        nameKo: "바닐라빈",
        nameEn: "Vanilla Bean",
        scientificName: "Vanilla planifolia",
        flavorProfile: {
            top: "부드럽고 크리미한 단향",
            mid: "은은한 우디·스모키함",
            base: "깊고 진한 단맛의 잔향",
        },
        flavorChart: chart(5, 15, 15, 40, 95),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "꼬투리를 세로로 갈라 씨를 긁어낸 뒤 주정에 수 주간 침출해, 열을 가하지 않고도 은은하고 부드러운 단향을 온전히 우려냅니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "damask-rose",
        nameKo: "다마스크 장미",
        nameEn: "Damask Rose",
        scientificName: "Rosa damascena",
        flavorProfile: {
            top: "우아하고 화사한 장미향",
            mid: "은은한 꿀 같은 단맛",
            base: "가벼운 그린 노트의 여운",
        },
        flavorChart: chart(10, 5, 95, 15, 40),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "불가리아산 로즈 워터를 저온에서 소량씩 블렌딩해, 향이 과하게 뭉치지 않고 우아하게 배경에 깔리도록 섬세하게 조절합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "chamomile",
        nameKo: "카모마일",
        nameEn: "Chamomile",
        scientificName: "Matricaria chamomilla",
        flavorProfile: {
            top: "사과를 닮은 부드러운 꽃향",
            mid: "은은한 허브티 뉘앙스",
            base: "가벼운 단맛의 여운",
        },
        flavorChart: chart(15, 10, 75, 20, 35),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "말린 꽃을 미온수에 우린 뒤 주정에 더하는 이중 침출 방식으로, 국화과 특유의 진정감 있는 향을 부드럽게 옮겨 담습니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "lavender",
        nameKo: "라벤더",
        nameEn: "Lavender",
        scientificName: "Lavandula angustifolia",
        flavorProfile: {
            top: "청량하고 허브틱한 플로럴",
            mid: "은은한 우디 뉘앙스",
            base: "가벼운 비누향의 여운",
        },
        flavorChart: chart(15, 15, 80, 25, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "향이 매우 강해 과량 사용 시 비누처럼 느껴질 수 있으므로, 증기 바스켓에 짧은 시간만 노출시켜 은은한 뉘앙스로만 남깁니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "elderflower",
        nameKo: "엘더플라워",
        nameEn: "Elderflower",
        scientificName: "Sambucus nigra",
        flavorProfile: {
            top: "리치를 닮은 화사한 꽃향",
            mid: "은은한 배 같은 과일향",
            base: "가벼운 꿀의 여운",
        },
        flavorChart: chart(25, 5, 85, 15, 50),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "초여름에 채취한 흰 꽃송이를 그늘에서 말린 뒤 저온 침출하여, 열대 과일을 연상시키는 화사하고 달콤한 향을 살립니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "hibiscus",
        nameKo: "히비스커스",
        nameEn: "Hibiscus",
        scientificName: "Hibiscus sabdariffa",
        flavorProfile: {
            top: "새콤한 베리 같은 산미",
            mid: "은은한 꽃향",
            base: "가벼운 떫은 여운",
        },
        flavorChart: chart(40, 5, 60, 15, 25),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "안토시아닌 색소가 풍부해 침출액에 자연스러운 붉은빛을 더하는 동시에, 크랜베리를 닮은 새콤한 산미를 함께 부여합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "jasmine",
        nameKo: "자스민",
        nameEn: "Jasmine",
        scientificName: "Jasminum officinale",
        flavorProfile: {
            top: "짙고 관능적인 꽃향",
            mid: "은은한 과일 뉘앙스",
            base: "가벼운 티(Tea) 향의 여운",
        },
        flavorChart: chart(10, 5, 90, 20, 30),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "밤에 개화한 꽃을 새벽에 채취해야 향이 가장 짙다고 알려져 있으며, 소량만 사용해도 존재감이 강해 배합비를 신중히 조절합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "chrysanthemum",
        nameKo: "국화",
        nameEn: "Chrysanthemum",
        scientificName: "Chrysanthemum morifolium",
        flavorProfile: {
            top: "은은하고 담백한 꽃향",
            mid: "허브티 같은 씁쓸한 뉘앙스",
            base: "가벼운 단맛의 여운",
        },
        flavorChart: chart(10, 10, 70, 30, 25),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "국화차를 우리듯 미온수에 먼저 개화시킨 뒤 주정에 더해, 화려하지 않지만 은은하고 정갈한 동양적 꽃향을 담아냅니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "honeysuckle",
        nameKo: "인동초",
        nameEn: "Honeysuckle",
        scientificName: "Lonicera japonica",
        flavorProfile: {
            top: "달콤하고 청량한 꽃향",
            mid: "은은한 꿀 뉘앙스",
            base: "가벼운 허브 여운",
        },
        flavorChart: chart(15, 10, 78, 25, 45),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "예로부터 해열 약재로도 쓰인 꽃으로, 은은한 꿀향과 청량감이 동시에 느껴져 화사한 계열 진의 배경 향으로 즐겨 사용합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "bay-leaf",
        nameKo: "월계수 잎",
        nameEn: "Bay Leaf",
        scientificName: "Laurus nobilis",
        flavorProfile: {
            top: "허브틱하고 은은한 향신향",
            mid: "가벼운 유칼립투스 뉘앙스",
            base: "은은한 쓴맛의 여운",
        },
        flavorChart: chart(15, 30, 15, 55, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "말린 잎을 잘게 부수어 침출해야 세포벽 안의 시네올 성분이 빠르게 우러나며, 과하면 쓴맛이 강해져 1~2장만 사용합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "rosemary",
        nameKo: "로즈마리",
        nameEn: "Rosemary",
        scientificName: "Salvia rosmarinus",
        flavorProfile: {
            top: "송진 같은 청량한 허브향",
            mid: "은은한 우디함",
            base: "가벼운 민트 여운",
        },
        flavorChart: chart(20, 25, 25, 50, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "생잎을 증기 바스켓에 올려 짧게 주입하면 조리용으로 쓸 때보다 훨씬 산뜻하고 청량한 허브향만 골라 담을 수 있습니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "thyme",
        nameKo: "타임",
        nameEn: "Thyme",
        scientificName: "Thymus vulgaris",
        flavorProfile: {
            top: "알싸하고 흙내음이 도는 허브향",
            mid: "은은한 스파이시함",
            base: "가벼운 민트 여운",
        },
        flavorChart: chart(15, 35, 20, 60, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "티몰 성분이 풍부해 소독약처럼 느껴질 수 있는 강한 허브로, 짧은 증기 주입만으로 배경 향을 은은하게 채우는 용도로 사용합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "sage",
        nameKo: "세이지",
        nameEn: "Sage",
        scientificName: "Salvia officinalis",
        flavorProfile: {
            top: "쌉싸름하고 은은한 허브향",
            mid: "가벼운 민트·유칼립투스 뉘앙스",
            base: "은은한 우디 여운",
        },
        flavorChart: chart(10, 30, 15, 55, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "장시간 침출 시 약재 냄새가 강해지므로, 다른 허브류와 마찬가지로 증류 말미 짧은 증기 주입으로만 향을 더합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "peppermint",
        nameKo: "페퍼민트",
        nameEn: "Peppermint",
        scientificName: "Mentha piperita",
        flavorProfile: {
            top: "화하고 시원한 민트향",
            mid: "은은한 그린 노트",
            base: "가벼운 청량함의 여운",
        },
        flavorChart: chart(20, 10, 25, 20, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "멘톨 성분이 강해 극소량으로도 청량감이 뚜렷하게 살아나며, 여름 시즌 한정 라인업의 상쾌한 인상을 만들 때 주로 사용합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "lemon-verbena",
        nameKo: "레몬버베나",
        nameEn: "Lemon Verbena",
        scientificName: "Aloysia citrodora",
        flavorProfile: {
            top: "레몬그라스보다 섬세한 시트러스",
            mid: "은은한 그린 허브 뉘앙스",
            base: "가벼운 산뜻함의 여운",
        },
        flavorChart: chart(75, 15, 25, 20, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "레몬 특유의 향은 비슷하지만 산미 없이 우아하게 마무리되어, 산미가 강한 시트러스 필과 함께 균형을 맞추기 좋습니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "lemon-balm",
        nameKo: "레몬밤",
        nameEn: "Lemon Balm",
        scientificName: "Melissa officinalis",
        flavorProfile: {
            top: "부드러운 레몬향과 그린 노트",
            mid: "은은한 민트 뉘앙스",
            base: "가벼운 허브 여운",
        },
        flavorChart: chart(65, 10, 20, 25, 10),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "박하과에 속해 레몬향 아래 은은한 민트 뉘앙스가 함께 느껴지며, 진정 효과가 있는 허브차 재료로도 널리 쓰입니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "gentian-root",
        nameKo: "젠티안 루트",
        nameEn: "Gentian Root",
        scientificName: "Gentiana lutea",
        flavorProfile: {
            top: "강렬하고 깊은 쓴맛",
            mid: "흙내음이 도는 루티(Rooty)함",
            base: "길게 남는 씁쓸한 여운",
        },
        flavorChart: chart(5, 20, 5, 90, 5),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "리큐르·비터스에서 쓴맛의 근간을 이루는 뿌리로, 장기간 저온 침출해야 떫은 잡맛 없이 깔끔한 쓴맛만을 추출할 수 있습니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "wormwood",
        nameKo: "웜우드",
        nameEn: "Wormwood",
        scientificName: "Artemisia absinthium",
        flavorProfile: {
            top: "강한 쑥향과 쌉싸름함",
            mid: "은은한 아니스 뉘앙스",
            base: "긴 쓴맛의 여운",
        },
        flavorChart: chart(5, 30, 10, 80, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "압생트의 핵심 원료로 알려진 강렬한 쓴쑥으로, 투우존 함량 규제에 맞춰 극소량만 배합해 복합적인 쓴맛의 레이어를 더합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "sweet-flag",
        nameKo: "창포(석창포)",
        nameEn: "Sweet Flag",
        scientificName: "Acorus calamus",
        flavorProfile: {
            top: "은은하고 스파이시한 뿌리향",
            mid: "가벼운 우디함",
            base: "따뜻한 여운",
        },
        flavorChart: chart(10, 40, 5, 75, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "예로부터 단오에 머리를 감던 풍습으로 익숙한 뿌리로, 은은한 스파이시함과 흙내음을 동시에 지니고 있어 뿌리 계열 리큐르에 사용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "sarsaparilla",
        nameKo: "사르사파릴라",
        nameEn: "Sarsaparilla",
        scientificName: "Smilax ornata",
        flavorProfile: {
            top: "루트비어를 닮은 달콤 쌉싸름함",
            mid: "은은한 바닐라 뉘앙스",
            base: "깊은 우디 여운",
        },
        flavorChart: chart(5, 25, 5, 70, 55),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "루트비어 특유의 향을 만드는 핵심 원료로, 뿌리를 잘게 썰어 오랜 시간 가열 침출해야 깊은 단맛과 우디함이 함께 우러납니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "douglas-fir-tip",
        nameKo: "더글라스 퍼 팁",
        nameEn: "Douglas Fir Tip",
        scientificName: "Pseudotsuga menziesii",
        flavorProfile: {
            top: "숲을 연상시키는 청량한 침엽향",
            mid: "은은한 시트러스 뉘앙스",
            base: "깊은 우디함의 여운",
        },
        flavorChart: chart(30, 10, 10, 80, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "봄철에 돋아난 연한 새순만을 채취해 사용하며, 다 자란 잎보다 훨씬 상큼하고 시트러스에 가까운 침엽향을 냅니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "sandalwood",
        nameKo: "샌달우드",
        nameEn: "Sandalwood",
        scientificName: "Santalum album",
        flavorProfile: {
            top: "부드럽고 은은한 우디향",
            mid: "크리미한 질감",
            base: "따뜻하고 깊은 여운",
        },
        flavorChart: chart(5, 10, 15, 90, 20),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "칩(Chip) 형태로 얇게 저민 목재를 장기간 냉침출해, 인센스를 연상시키는 부드럽고 크리미한 우디함을 조용히 배경에 깔아줍니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "saffron",
        nameKo: "사프란",
        nameEn: "Saffron",
        scientificName: "Crocus sativus",
        flavorProfile: {
            top: "건초를 닮은 독특한 향",
            mid: "은은한 꿀 뉘앙스",
            base: "미묘한 금속성의 여운",
        },
        flavorChart: chart(10, 30, 40, 45, 40),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "세계에서 가장 비싼 향신료답게 극소량의 암술머리만으로도 뚜렷한 황금빛과 독특한 향을 내, 시그니처 한정판에만 소량 사용합니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "green-tea-leaf",
        nameKo: "녹차잎",
        nameEn: "Green Tea Leaf",
        scientificName: "Camellia sinensis",
        flavorProfile: {
            top: "신선하고 풋풋한 그린 노트",
            mid: "은은한 떫은맛",
            base: "가벼운 감칠맛의 여운",
        },
        flavorChart: chart(20, 5, 20, 40, 15),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "찻잎을 우리듯 미온수에 짧게 우린 뒤 주정에 더해, 떫은 탄닌은 최소화하고 신선한 그린 향만을 골라 담습니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "cacao-nib",
        nameKo: "카카오 닙스",
        nameEn: "Cacao Nib",
        scientificName: "Theobroma cacao",
        flavorProfile: {
            top: "은은한 초콜릿향",
            mid: "쌉싸름한 로스티(Roasty)함",
            base: "깊고 진한 여운",
        },
        flavorChart: chart(5, 15, 5, 60, 60),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "볶은 카카오콩을 부순 닙스를 장기간 주정에 침출해, 설탕 없이도 초콜릿 특유의 쌉싸름하고 깊은 여운을 만들어냅니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "tonka-bean",
        nameKo: "통카빈",
        nameEn: "Tonka Bean",
        scientificName: "Dipteryx odorata",
        flavorProfile: {
            top: "바닐라와 아몬드가 섞인 듯한 향",
            mid: "은은한 건초·시나몬 뉘앙스",
            base: "깊고 따뜻한 여운",
        },
        flavorChart: chart(5, 20, 10, 55, 80),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "쿠마린 함량이 높아 극소량만 갈아 넣어도 바닐라·아몬드·건초가 뒤섞인 복합적인 단향을 낼 수 있어 신중한 계량이 필요합니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "perilla-leaf",
        nameKo: "들깻잎",
        nameEn: "Perilla Leaf",
        scientificName: "Perilla frutescens",
        flavorProfile: {
            top: "독특하고 알싸한 그린 허브향",
            mid: "은은한 시트러스 뉘앙스",
            base: "가벼운 스파이시 여운",
        },
        flavorChart: chart(25, 35, 15, 40, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "한식 밥상에서 익숙한 향을 진에 접목한 국산 보태니컬로, 생잎을 증기 주입해 특유의 알싸하고 독특한 그린 노트를 살립니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "mugwort",
        nameKo: "쑥",
        nameEn: "Mugwort",
        scientificName: "Artemisia princeps",
        flavorProfile: {
            top: "진한 쑥 특유의 향",
            mid: "은은한 허브·쓴맛",
            base: "깊고 흙내음 도는 여운",
        },
        flavorChart: chart(10, 25, 10, 85, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "한국의 봄을 상징하는 재료로, 말린 쑥을 침출·가열해 향을 우려내면 쌉싸름함 속에 은은한 단맛이 함께 느껴집니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "omija",
        nameKo: "오미자",
        nameEn: "Omija (Five-Flavor Berry)",
        scientificName: "Schisandra chinensis",
        flavorProfile: {
            top: "새콤달콤한 베리향",
            mid: "짭짤함과 쌉싸름함이 공존",
            base: "매콤한 여운까지 다섯 가지 맛",
        },
        flavorChart: chart(55, 30, 15, 30, 45),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "이름 그대로 달고, 시고, 짜고, 맵고, 쓴 다섯 가지 맛을 한 열매 안에 지니고 있어, 냉침출로 그 복합적인 맛의 층위를 온전히 살립니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "maesil",
        nameKo: "매실",
        nameEn: "Maesil (Korean Plum)",
        scientificName: "Prunus mume",
        flavorProfile: {
            top: "상큼하고 새콤한 청매실향",
            mid: "은은한 씨앗의 아몬드 뉘앙스",
            base: "가벼운 산미의 여운",
        },
        flavorChart: chart(60, 10, 20, 15, 40),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "덜 익은 청매실을 통째로 장기간 당침·침출해, 새콤한 산미와 씨앗에서 우러나는 은은한 아몬드 향을 함께 담아냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "deodeok",
        nameKo: "더덕",
        nameEn: "Deodeok",
        scientificName: "Codonopsis lanceolata",
        flavorProfile: {
            top: "은은하고 쌉싸름한 뿌리향",
            mid: "구수하고 흙내음 도는 향",
            base: "깊은 여운의 단맛",
        },
        flavorChart: chart(5, 20, 10, 85, 25),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "산삼의 사촌으로 불리는 국내 자생 뿌리로, 껍질을 벗겨 두드린 뒤 침출해야 특유의 쌉싸름하고 구수한 향이 진하게 우러납니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "ginseng",
        nameKo: "인삼",
        nameEn: "Ginseng",
        scientificName: "Panax ginseng",
        flavorProfile: {
            top: "쌉싸름하고 흙내음 도는 향",
            mid: "은은한 스파이시함",
            base: "깊고 따뜻한 여운",
        },
        flavorChart: chart(5, 30, 5, 90, 15),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "한국을 대표하는 약용 뿌리로, 사포닌 성분이 장기간 저온 침출을 통해 서서히 우러나며 묵직하고 깊은 뿌리 향을 완성합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "goji-berry",
        nameKo: "구기자",
        nameEn: "Goji Berry",
        scientificName: "Lycium chinense",
        flavorProfile: {
            top: "은은하고 달콤한 베리향",
            mid: "가벼운 흙내음",
            base: "부드러운 단맛의 여운",
        },
        flavorChart: chart(20, 10, 15, 45, 55),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "말린 구기자 열매를 장기간 침출하면 건포도를 닮은 은은한 단맛이 우러나, 뿌리·약재 계열 원료의 쌉싸름함을 부드럽게 감싸줍니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "corn-silk",
        nameKo: "옥수수수염",
        nameEn: "Corn Silk",
        scientificName: "Zea mays",
        flavorProfile: {
            top: "은은하고 구수한 곡물향",
            mid: "가벼운 풀내음",
            base: "부드러운 단맛의 여운",
        },
        flavorChart: chart(5, 5, 10, 50, 40),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "차로도 즐겨 마시는 옥수수의 수염을 가볍게 덖은 뒤 침출해, 곡물 베이스 소주와 잘 어우러지는 구수하고 부드러운 향을 더합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "rau-ram",
        nameKo: "라우람 (베트남 고수)",
        nameEn: "Rau Răm (Vietnamese Coriander)",
        scientificName: "Persicaria odorata",
        flavorProfile: {
            top: "톡 쏘는 매콤한 허브향",
            mid: "고수와는 다른 알싸한 후추 뉘앙스",
            base: "은은한 흙내음의 여운",
        },
        flavorChart: chart(20, 55, 10, 45, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "베트남 남부 습지에서 자생하는 여뀌과 허브로, 고수와 이름이 비슷하지만 향은 전혀 달라 매콤하고 알싸한 개성을 짧은 증기 주입으로만 담아냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "ngo-gai",
        nameKo: "응오가이 (긴잎고수)",
        nameEn: "Culantro (Ngò Gai)",
        scientificName: "Eryngium foetidum",
        flavorProfile: {
            top: "고수보다 훨씬 강렬한 시트러스·허브향",
            mid: "은은한 그린 노트",
            base: "가벼운 흙내음의 여운",
        },
        flavorChart: chart(35, 15, 10, 40, 5),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "톱니 모양의 잎을 가진 베트남 쌀국수 필수 허브로, 일반 고수보다 향이 훨씬 진해 저온에서 짧게 침출해도 뚜렷한 존재감을 남깁니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "diep-ca",
        nameKo: "지엡까 (어성초)",
        nameEn: "Fish Mint (Diếp Cá)",
        scientificName: "Houttuynia cordata",
        flavorProfile: {
            top: "독특하고 강렬한 비린 향",
            mid: "은은한 그린·시트러스 뉘앙스",
            base: "가벼운 쌉싸름함의 여운",
        },
        flavorChart: chart(25, 10, 10, 55, 5),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "생선 비린내를 닮았다 하여 '어성초'라 불리는 베트남 대표 약초로, 호불호가 뚜렷한 만큼 극소량만 배합해 복합적인 배경향으로 사용합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "kinh-gioi",
        nameKo: "낀져이 (베트남 박하)",
        nameEn: "Vietnamese Balm (Kinh Giới)",
        scientificName: "Elsholtzia ciliata",
        flavorProfile: {
            top: "상쾌한 시트러스·민트향",
            mid: "은은한 스파이시 뉘앙스",
            base: "가벼운 청량함의 여운",
        },
        flavorChart: chart(30, 20, 25, 20, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "베트남 쌈 채소로 흔히 쓰이는 허브로, 민트와 레몬그라스 사이 어딘가의 향을 지녀 시트러스 계열 진의 배경향을 풍부하게 채워줍니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "hung-que",
        nameKo: "흥꿰 (타이 바질)",
        nameEn: "Vietnamese Basil (Húng Quế)",
        scientificName: "Ocimum basilicum var. thyrsiflora",
        flavorProfile: {
            top: "달콤한 아니스·정향 뉘앙스",
            mid: "화사한 허브향",
            base: "은은한 스파이시 여운",
        },
        flavorChart: chart(15, 45, 35, 15, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "이탈리안 바질보다 아니스와 정향에 가까운 향을 지닌 품종으로, 자주색 줄기와 보라색 꽃이 특징이며 짧은 증기 주입으로 화사함만 살립니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "hung-lui",
        nameKo: "흥루이 (베트남 스피어민트)",
        nameEn: "Vietnamese Spearmint (Húng Lủi)",
        scientificName: "Mentha spicata",
        flavorProfile: {
            top: "부드럽고 달콤한 민트향",
            mid: "은은한 그린 노트",
            base: "가벼운 청량함의 여운",
        },
        flavorChart: chart(20, 10, 20, 15, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "페퍼민트보다 멘톨 자극이 부드럽고 단맛이 도는 품종으로, 하노이 골목 어디서나 자라는 흔한 허브지만 향은 섬세하게 다뤄야 합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "la-lot",
        nameKo: "라롯 (야생 후추잎)",
        nameEn: "Wild Betel Leaf (Lá Lốt)",
        scientificName: "Piper sarmentosum",
        flavorProfile: {
            top: "은은한 후추향과 그린 노트",
            mid: "따뜻한 스파이시함",
            base: "가벼운 우디 여운",
        },
        flavorChart: chart(10, 50, 10, 55, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "쇠고기를 말아 굽는 베트남 요리 '보 라 롯'으로 유명한 잎으로, 후추과 특유의 알싸함이 은은하게 배어 있어 가열 침출로 향을 끌어냅니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "trau-khong",
        nameKo: "쩌우콩 (베텔잎)",
        nameEn: "Betel Leaf (Trầu Không)",
        scientificName: "Piper betle",
        flavorProfile: {
            top: "날카롭고 강렬한 스파이시함",
            mid: "은은한 정향 뉘앙스",
            base: "긴 매콤한 여운",
        },
        flavorChart: chart(10, 60, 10, 50, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "베트남 전통 혼례 예물로도 쓰이는 상징적인 잎으로, 카바비놀 성분이 풍부해 소량만 침출해도 화한 스파이시함이 뚜렷하게 남습니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "que-tra-my",
        nameKo: "꾸에 짜미 (베트남 계피)",
        nameEn: "Vietnamese Cinnamon (Quế Trà My)",
        scientificName: "Cinnamomum loureiroi",
        flavorProfile: {
            top: "진하고 달콤한 나무껍질 향",
            mid: "묵직한 스파이시함",
            base: "오래가는 우디·스위트 여운",
        },
        flavorChart: chart(5, 90, 10, 55, 70),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "꽝남·꽝응아이 산간지역에서 나는 세계 최고급 계피 중 하나로, 정유 함량이 카시아보다도 높아 훨씬 진하고 달콤한 스파이시함을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "sam-ngoc-linh",
        nameKo: "삼 응옥린 (옥린산삼)",
        nameEn: "Ngoc Linh Ginseng",
        scientificName: "Panax vietnamensis",
        flavorProfile: {
            top: "쌉싸름하고 짙은 흙내음",
            mid: "은은한 인삼 특유의 향",
            base: "깊고 묵직한 여운",
        },
        flavorChart: chart(5, 25, 5, 95, 15),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "꽝남성 응옥린산 해발 1,500m 이상에서만 자생하는 베트남 특산 인삼으로, 사포닌 함량이 높아 장기간 저온 침출로 깊은 뿌리향을 온전히 우려냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "sam-bo-chinh",
        nameKo: "삼 보찐 (베트남 뿌리인삼)",
        nameEn: "Sâm Bố Chính",
        scientificName: "Abelmoschus sagittifolius",
        flavorProfile: {
            top: "은은하고 부드러운 뿌리향",
            mid: "가벼운 단맛",
            base: "따뜻한 흙내음의 여운",
        },
        flavorChart: chart(5, 15, 10, 80, 35),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "무궁화과에 속하지만 '베트남 인삼'이라 불릴 만큼 널리 쓰이는 강장 뿌리로, 응옥린산삼보다 순하고 부드러운 단맛이 특징입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "tam-that",
        nameKo: "땀텃 (삼칠근)",
        nameEn: "Notoginseng (Tam Thất)",
        scientificName: "Panax notoginseng",
        flavorProfile: {
            top: "강한 쓴맛과 흙내음",
            mid: "은은한 인삼향",
            base: "길게 남는 쌉싸름한 여운",
        },
        flavorChart: chart(5, 20, 5, 90, 10),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "하장·라오까이의 고산지대에서 재배되는 뿌리로, 인삼속 식물 중에서도 쓴맛이 가장 강해 소량만 배합해 묵직한 뼈대를 잡아줍니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "dinh-lang",
        nameKo: "딘랑 (서민 인삼)",
        nameEn: "Đinh Lăng (Polyscias)",
        scientificName: "Polyscias fruticosa",
        flavorProfile: {
            top: "은은한 그린 허브향",
            mid: "가벼운 흙내음",
            base: "구수한 여운",
        },
        flavorChart: chart(10, 20, 10, 70, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "'서민의 인삼'이라 불릴 만큼 베트남 가정에서 흔히 재배하는 관목으로, 잎과 뿌리 모두 사용 가능하며 순하고 구수한 향을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "ba-kich",
        nameKo: "바 킥 (자색 뿌리)",
        nameEn: "Ba Kích (Morinda Root)",
        scientificName: "Morinda officinalis",
        flavorProfile: {
            top: "은은한 단맛과 흙내음",
            mid: "가벼운 스파이시함",
            base: "깊고 진한 여운",
        },
        flavorChart: chart(5, 25, 10, 75, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "베트남 북부 전통 '루어우 바 킥(Rượu Ba Kích)'의 핵심 원료로, 침출 시 자색으로 물드는 것이 특징이며 은은한 단맛과 강장감을 더합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "mat-nhan",
        nameKo: "멋년 (통캇알리)",
        nameEn: "Mật Nhân (Tongkat Ali)",
        scientificName: "Eurycoma longifolia",
        flavorProfile: {
            top: "극도로 강렬한 쓴맛",
            mid: "은은한 흙내음",
            base: "길게 남는 쌉싸름한 여운",
        },
        flavorChart: chart(5, 15, 5, 85, 5),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "베트남 중부 산간에서 자생하는 강장 뿌리로, 남성 보양주 재료로 유명할 만큼 쓴맛이 강렬해 다른 단맛 원료와 균형을 맞춰 사용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "nhau",
        nameKo: "냐우 (노니)",
        nameEn: "Noni (Nhàu)",
        scientificName: "Morinda citrifolia",
        flavorProfile: {
            top: "독특하고 발효된 듯한 향",
            mid: "은은한 흙내음",
            base: "가벼운 단맛의 여운",
        },
        flavorChart: chart(15, 10, 5, 60, 30),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "잘 익은 열매를 그늘에서 말린 뒤 침출하며, 특유의 강한 향 때문에 호불호가 갈리지만 베트남 민간요법에서 오래도록 사랑받아온 열매입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "tao-meo",
        nameKo: "따오 메오 (사파 산사자)",
        nameEn: "Sapa Hawthorn (Táo Mèo)",
        scientificName: "Docynia indica",
        flavorProfile: {
            top: "새콤하고 상큼한 사과향",
            mid: "은은한 꽃향",
            base: "가벼운 산미의 여운",
        },
        flavorChart: chart(55, 10, 15, 20, 45),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "사파(Sapa)의 고산 소수민족 마을에서 재배되는 야생 사과로, 새콤달콤한 산미가 뚜렷해 과일 침출주의 상큼한 뼈대를 이룹니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "chuoi-hot",
        nameKo: "쭈오이 홋 (야생 바나나)",
        nameEn: "Wild Banana (Chuối Hột)",
        scientificName: "Musa balbisiana",
        flavorProfile: {
            top: "은은하고 담백한 곡물향",
            mid: "가벼운 흙내음",
            base: "부드러운 단맛의 여운",
        },
        flavorChart: chart(10, 5, 10, 50, 55),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "씨가 있는 야생 바나나를 얇게 썰어 말린 뒤 침출하는 베트남 전통 '루어우 쭈오이 홋'의 원료로, 담백하고 은은한 단맛을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "ca-gai-leo",
        nameKo: "까 가이 레오",
        nameEn: "Cà Gai Leo",
        scientificName: "Solanum procumbens",
        flavorProfile: {
            top: "은은한 쓴맛",
            mid: "가벼운 허브향",
            base: "깔끔한 여운",
        },
        flavorChart: chart(10, 20, 10, 60, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "간 건강에 좋다고 알려져 차로도 널리 마시는 베트남 덩굴 허브로, 순한 쓴맛이 특징이라 강한 스파이스 원료의 균형추 역할을 합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "xa-den",
        nameKo: "사 덴 (검은 덩굴)",
        nameEn: "Xạ Đen",
        scientificName: "Celastrus hindsii",
        flavorProfile: {
            top: "은은한 쌉싸름함",
            mid: "구수한 허브향",
            base: "깔끔한 여운",
        },
        flavorChart: chart(5, 15, 5, 70, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "베트남 북부 산간에서 채취되는 덩굴 식물로, 잎과 줄기를 덖어 침출하면 구수하고 은은한 쓴맛의 차 같은 향이 우러납니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "che-day",
        nameKo: "쩨 저이 (덩굴차)",
        nameEn: "Vine Tea (Chè Dây)",
        scientificName: "Ampelopsis cantoniensis",
        flavorProfile: {
            top: "은은하고 부드러운 단맛",
            mid: "가벼운 허브향",
            base: "깔끔한 여운",
        },
        flavorChart: chart(10, 10, 10, 45, 35),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "베트남 북부 소수민족이 즐겨 마시는 덩굴 잎차로, 우려내면 은은한 단맛이 돌아 다른 쓴맛 원료의 뒷맛을 부드럽게 정리해줍니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "nhan-tran",
        nameKo: "년 짠",
        nameEn: "Nhân Trần (Adenosma)",
        scientificName: "Adenosma caeruleum",
        flavorProfile: {
            top: "향긋하고 은은한 허브향",
            mid: "가벼운 쌉싸름함",
            base: "깔끔한 여운",
        },
        flavorChart: chart(15, 25, 15, 55, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "여름철 시원하게 즐기는 베트남 국민 허브차 원료로, 말린 잎을 증기 주입해 향긋함은 살리고 탁한 잡내는 배제합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "cam-thao-dat",
        nameKo: "깜타오 닷 (야생 감초)",
        nameEn: "Wild Licorice (Cam Thảo Đất)",
        scientificName: "Scoparia dulcis",
        flavorProfile: {
            top: "은은한 단맛",
            mid: "가벼운 허브향",
            base: "깔끔한 여운",
        },
        flavorChart: chart(5, 15, 10, 45, 60),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "서양 감초와는 다른 종이지만 은은한 단맛을 지녀 베트남에서 감초 대용 허브차로 즐겨 마시며, 부드러운 배경 단맛을 더할 때 사용합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "bo-cong-anh",
        nameKo: "보 꽁 아잉 (베트남 민들레)",
        nameEn: "Vietnamese Dandelion (Bồ Công Anh)",
        scientificName: "Lactuca indica",
        flavorProfile: {
            top: "쌉싸름한 그린 노트",
            mid: "은은한 허브향",
            base: "깔끔한 여운",
        },
        flavorChart: chart(10, 10, 10, 55, 10),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "서양 민들레와는 다른 상추속 식물로, 잎을 말려 침출하면 은은한 쓴맛의 그린 노트가 우러나 해독차 원료로도 널리 쓰입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "atiso-dalat",
        nameKo: "아띠소 달랏 (달랏 아티초크)",
        nameEn: "Dalat Artichoke (Atiso)",
        scientificName: "Cynara scolymus",
        flavorProfile: {
            top: "은은하고 부드러운 채소향",
            mid: "가벼운 쌉싸름함",
            base: "따뜻한 단맛의 여운",
        },
        flavorChart: chart(10, 10, 15, 60, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "고원 도시 달랏(Đà Lạt)의 명물로, 꽃봉오리와 줄기를 오래 가열 침출하면 은은한 단맛과 쌉싸름함이 균형을 이루는 차향이 우러납니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "co-ngot",
        nameKo: "꼬 응옷 (스테비아)",
        nameEn: "Stevia (Cỏ Ngọt)",
        scientificName: "Stevia rebaudiana",
        flavorProfile: {
            top: "설탕보다 진한 순수한 단맛",
            mid: "은은한 허브 뉘앙스",
            base: "깔끔하게 떨어지는 여운",
        },
        flavorChart: chart(5, 5, 10, 20, 98),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "달랏 고원에서 재배되는 잎으로, 설탕 없이도 강한 단맛을 낼 수 있어 당분을 최소화하고 싶은 저당 리큐르 레시피에 활용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "hoa-hoe",
        nameKo: "호아 호에 (회화나무 꽃봉오리)",
        nameEn: "Sophora Bud (Hoa Hòe)",
        scientificName: "Sophora japonica",
        flavorProfile: {
            top: "은은하고 담백한 꽃향",
            mid: "가벼운 쌉싸름함",
            base: "깔끔한 여운",
        },
        flavorChart: chart(10, 10, 60, 30, 20),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "베트남 가로수로도 흔히 심는 회화나무의 마른 꽃봉오리로, 루틴 성분이 풍부해 은은한 꽃향과 함께 담백한 뒷맛을 남깁니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "bai-zhi",
        nameKo: "백지",
        nameEn: "Bai Zhi",
        scientificName: "Angelica dahurica",
        flavorProfile: {
            top: "흙내음이 강한 뿌리향",
            mid: "은은한 쓴맛과 단단한 구조감",
            base: "깊은 우디함의 여운",
        },
        flavorChart: chart(5, 25, 5, 85, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "유럽산 안젤리카 루트와는 다른 종으로, 뿌리 특유의 흙내음과 단단한 구조감을 더합니다. 과량 사용 시 쓴맛이 두드러지므로 소량만 배합합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "corn-mint",
        nameKo: "박하",
        nameEn: "Corn Mint",
        scientificName: "Mentha arvensis",
        flavorProfile: {
            top: "화하고 청량한 멘톨향",
            mid: "은은한 그린 노트",
            base: "가벼운 청량함의 여운",
        },
        flavorChart: chart(15, 10, 15, 15, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description:
            "페퍼민트·스피어민트와는 다른 종으로, 멘톨 함량이 높아 훨씬 화한 청량감을 냅니다. 진한 허브류와 과하게 배합하면 인상이 강해지므로 균형에 신경 써야 합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "butterfly-pea-flower",
        nameKo: "나비콩꽃",
        nameEn: "Butterfly Pea Flower",
        scientificName: "Clitoria ternatea",
        flavorProfile: {
            top: "맛에 거의 기여하지 않는 은은한 향",
            mid: "가벼운 콩과 특유의 그린 노트",
            base: "거의 느껴지지 않는 여운",
        },
        flavorChart: chart(0, 0, 10, 10, 0),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "맛보다는 색을 위한 재료로, 산과 만나면 청색에서 보라·핑크로 변하는 것이 특징입니다. 시트러스를 더했을 때 색이 변하는 연출용으로 주로 활용합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "pandan-leaf",
        nameKo: "판단잎",
        nameEn: "Pandan Leaf",
        scientificName: "Pandanus amaryllifolius",
        flavorProfile: {
            top: "바닐라·코코넛을 닮은 은은한 향",
            mid: "자스민쌀을 연상시키는 향",
            base: "부드러운 그린 노트의 여운",
        },
        flavorChart: chart(0, 5, 10, 10, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "동남아 요리에서 바닐라 대용으로도 쓰이는 잎으로, 세포벽을 파쇄해야 향이 온전히 우러나 잘게 갈아서 침출합니다. 은은한 엽록소 빛깔도 함께 더해집니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "tsaoko",
        nameKo: "초과",
        nameEn: "Tsaoko (Black Cardamom)",
        scientificName: "Amomum tsaoko",
        flavorProfile: {
            top: "스모키하고 강렬한 향",
            mid: "따뜻한 스파이스",
            base: "깊고 훈연된 여운",
        },
        flavorChart: chart(5, 75, 5, 50, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description:
            "베트남 쌀국수 육수에도 쓰이는 향신료로, 건조·훈연 과정을 거쳐 일반 카다멈보다 훨씬 스모키하고 강렬한 향을 냅니다. 소량으로도 존재감이 뚜렷합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "lotus-flower",
        nameKo: "연꽃",
        nameEn: "Lotus Flower",
        scientificName: "Nelumbo nucifera",
        flavorProfile: {
            top: "은은하고 우아한 꽃향",
            mid: "가벼운 차(Tea) 뉘앙스",
            base: "부드러운 여운",
        },
        flavorChart: chart(10, 5, 75, 15, 25),
        extraction: "냉침출 (Cold Maceration)",
        description:
            "연잎차로도 즐겨 마시는 꽃으로, 은은하고 우아한 향이 특징입니다. 젠타로 로터스 진(ZENTARO Lotus Gin) 라인의 핵심 정체성 원료입니다.",
        relatedProduct: "ZENTARO Lotus Gin",
    },
    {
        id: "sweet-orange-peel",
        nameKo: "스위트 오렌지 껍질",
        nameEn: "Sweet Orange Peel",
        scientificName: "Citrus sinensis",
        flavorProfile: { top: "달콤하고 친숙한 오렌지향", mid: "은은한 산미", base: "가벼운 왁시함" },
        flavorChart: chart(85, 5, 10, 10, 40),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "비터 오렌지보다 부드럽고 달콤해 접근성 좋은 시트러스 배경을 만들 때 사용합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "mandarin-peel",
        nameKo: "만다린 껍질",
        nameEn: "Mandarin Peel",
        scientificName: "Citrus reticulata",
        flavorProfile: { top: "달콤하고 화사한 시트러스", mid: "은은한 꽃향", base: "가벼운 단맛의 여운" },
        flavorChart: chart(80, 5, 20, 10, 45),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "오렌지보다 가볍고 화사해 진피(귤껍질) 계열 중에서도 산뜻한 인상을 남깁니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "citron",
        nameKo: "시트론",
        nameEn: "Citron",
        scientificName: "Citrus medica",
        flavorProfile: { top: "강렬한 시트러스 오일향", mid: "두꺼운 왁시함", base: "은은한 쓴맛" },
        flavorChart: chart(90, 5, 5, 15, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "두꺼운 껍질에 정유가 풍부해 이탈리아 리큐르에서도 즐겨 쓰는 고농축 시트러스 원료입니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "pomelo-peel",
        nameKo: "포멜로 껍질",
        nameEn: "Pomelo Peel",
        scientificName: "Citrus maxima",
        flavorProfile: { top: "은은하고 청량한 시트러스", mid: "가벼운 쌉싸름함", base: "옅은 산미" },
        flavorChart: chart(75, 5, 10, 15, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "자몽보다 순하고 두꺼운 껍질을 가져, 은은한 시트러스 배경을 오래 유지하고 싶을 때 사용합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "calamansi",
        nameKo: "칼라만시",
        nameEn: "Calamansi",
        scientificName: "Citrus microcarpa",
        flavorProfile: { top: "새콤하고 강렬한 라임향", mid: "은은한 귤 뉘앙스", base: "가벼운 산미의 여운" },
        flavorChart: chart(90, 5, 10, 10, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "라임과 귤을 합쳐놓은 듯한 동남아 대표 시트러스로, 산미가 뚜렷해 소량만 사용합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "sudachi",
        nameKo: "스다치",
        nameEn: "Sudachi",
        scientificName: "Citrus sudachi",
        flavorProfile: { top: "날카롭고 청량한 시트러스", mid: "은은한 그린 노트", base: "깨끗한 산미의 여운" },
        flavorChart: chart(88, 5, 10, 10, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "유자와 사촌격인 일본 시트러스로, 유자보다 날카롭고 청량한 인상을 남깁니다.",
        relatedProduct: "ZENTARO Yuzu Gin",
    },
    {
        id: "finger-lime",
        nameKo: "핑거라임",
        nameEn: "Finger Lime",
        scientificName: "Citrus australasica",
        flavorProfile: { top: "톡톡 터지는 캐비어 같은 라임향", mid: "은은한 산미", base: "깨끗한 여운" },
        flavorChart: chart(85, 5, 5, 10, 10),
        extraction: "사후 블렌딩 (Post-Distillation Blending)",
        description: "'시트러스 캐비어'라 불리는 톡톡 터지는 과립 형태로, 완성 원액에 후첨해 식감과 향을 동시에 더합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "orange-blossom",
        nameKo: "오렌지 블라썸",
        nameEn: "Orange Blossom (Neroli)",
        scientificName: "Citrus aurantium",
        flavorProfile: { top: "우아하고 화사한 꽃향", mid: "은은한 꿀 뉘앙스", base: "가벼운 그린 여운" },
        flavorChart: chart(30, 5, 90, 15, 35),
        extraction: "냉침출 (Cold Maceration)",
        description: "비터 오렌지의 꽃에서 얻는 정유로, 껍질과는 전혀 다른 우아하고 화사한 플로럴을 냅니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "ylang-ylang",
        nameKo: "일랑일랑",
        nameEn: "Ylang Ylang",
        scientificName: "Cananga odorata",
        flavorProfile: { top: "짙고 크리미한 열대 꽃향", mid: "은은한 바나나 뉘앙스", base: "깊은 스위트 여운" },
        flavorChart: chart(10, 5, 95, 15, 45),
        extraction: "냉침출 (Cold Maceration)",
        description: "향수 업계에서도 즐겨 쓰는 짙고 관능적인 열대 꽃향으로, 극소량만 배합해야 균형이 유지됩니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "osmanthus",
        nameKo: "계화(목서)",
        nameEn: "Osmanthus",
        scientificName: "Osmanthus fragrans",
        flavorProfile: { top: "살구를 닮은 달콤한 꽃향", mid: "은은한 복숭아 뉘앙스", base: "부드러운 단맛의 여운" },
        flavorChart: chart(15, 5, 85, 10, 55),
        extraction: "냉침출 (Cold Maceration)",
        description: "중화권 리큐르·차에서 즐겨 쓰는 살구·복숭아를 닮은 달콤한 금목서 향입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "magnolia-flower",
        nameKo: "신이화(목련)",
        nameEn: "Magnolia Flower",
        scientificName: "Magnolia denudata",
        flavorProfile: { top: "은은하고 상쾌한 꽃향", mid: "가벼운 스파이시 뉘앙스", base: "옅은 우디 여운" },
        flavorChart: chart(15, 20, 75, 20, 20),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "말린 목련 꽃봉오리를 침출해, 은은하면서도 코를 시원하게 트이게 하는 독특한 꽃향을 냅니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "peony",
        nameKo: "작약",
        nameEn: "Peony",
        scientificName: "Paeonia lactiflora",
        flavorProfile: { top: "우아하고 로맨틱한 꽃향", mid: "은은한 장미 뉘앙스", base: "가벼운 여운" },
        flavorChart: chart(10, 5, 88, 15, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "장미보다 은은하고 부드러운 꽃향으로, 화사한 계열 블렌드에 우아함을 더합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "violet-flower",
        nameKo: "제비꽃",
        nameEn: "Violet Flower",
        scientificName: "Viola odorata",
        flavorProfile: { top: "파우더리하고 달콤한 꽃향", mid: "은은한 그린 노트", base: "부드러운 여운" },
        flavorChart: chart(10, 5, 80, 15, 40),
        extraction: "냉침출 (Cold Maceration)",
        description: "오리스 루트와 잘 어울리는 파우더리한 꽃향으로, 클래식 리큐르에서 오래도록 사랑받은 원료입니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "geranium",
        nameKo: "제라늄",
        nameEn: "Geranium",
        scientificName: "Pelargonium graveolens",
        flavorProfile: { top: "장미를 닮은 그린 플로럴", mid: "은은한 민트 뉘앙스", base: "가벼운 여운" },
        flavorChart: chart(20, 5, 75, 20, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "장미와 민트 사이의 향을 지녀, 값비싼 장미 정유를 대신해 화사함을 더할 때 사용합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "linden-flower",
        nameKo: "린덴 플라워(피나무꽃)",
        nameEn: "Linden Flower",
        scientificName: "Tilia cordata",
        flavorProfile: { top: "은은하고 부드러운 꿀 꽃향", mid: "가벼운 그린 노트", base: "옅은 단맛의 여운" },
        flavorChart: chart(15, 5, 70, 15, 40),
        extraction: "냉침출 (Cold Maceration)",
        description: "유럽에서 허브차로 즐겨 마시는 꽃으로, 진정감 있는 은은한 꿀향을 냅니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "marigold",
        nameKo: "마리골드(금잔화)",
        nameEn: "Marigold",
        scientificName: "Calendula officinalis",
        flavorProfile: { top: "은은하고 쌉싸름한 꽃향", mid: "가벼운 허브 뉘앙스", base: "옅은 여운" },
        flavorChart: chart(10, 10, 55, 20, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "샤프란 대용으로도 쓰이는 꽃잎으로, 은은한 색과 함께 쌉싸름한 배경 향을 더합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "safflower",
        nameKo: "홍화",
        nameEn: "Safflower",
        scientificName: "Carthamus tinctorius",
        flavorProfile: { top: "은은한 건초향", mid: "가벼운 쓴맛", base: "옅은 여운" },
        flavorChart: chart(5, 10, 45, 25, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "붉은 색소로도 쓰이는 꽃잎으로, 향보다는 은은한 색감을 더하는 보조 원료로 활용합니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "long-pepper",
        nameKo: "롱페퍼(필발)",
        nameEn: "Long Pepper",
        scientificName: "Piper longum",
        flavorProfile: { top: "달콤하고 화한 스파이시함", mid: "은은한 흙내음", base: "긴 매운 여운" },
        flavorChart: chart(10, 85, 5, 40, 20),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "일반 후추보다 달콤하고 복합적인 매운맛을 지녀, 고대 로마 시대부터 귀하게 쓰인 향신료입니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "grains-of-selim",
        nameKo: "그레인 오브 셀림",
        nameEn: "Grains of Selim",
        scientificName: "Xylopia aethiopica",
        flavorProfile: { top: "스모키하고 후추 같은 향", mid: "은은한 우디함", base: "긴 스파이시 여운" },
        flavorChart: chart(5, 80, 5, 55, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "서아프리카산 씨앗 꼬투리로, 후추와 육두구 사이의 스모키한 향을 냅니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "ajwain",
        nameKo: "아즈완",
        nameEn: "Ajwain",
        scientificName: "Trachyspermum ammi",
        flavorProfile: { top: "타임을 닮은 강한 허브향", mid: "은은한 쓴맛", base: "긴 여운" },
        flavorChart: chart(10, 55, 15, 45, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "타임보다 훨씬 강렬한 티몰 향을 지녀, 극소량만으로도 존재감이 뚜렷합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "caraway",
        nameKo: "캐러웨이",
        nameEn: "Caraway",
        scientificName: "Carum carvi",
        flavorProfile: { top: "아니스를 닮은 스파이시함", mid: "은은한 흙내음", base: "긴 여운" },
        flavorChart: chart(10, 65, 10, 40, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "북유럽 아쿠아비트의 핵심 향신료로, 아니스와 흙내음이 섞인 독특한 스파이시함을 냅니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "cumin",
        nameKo: "커민",
        nameEn: "Cumin",
        scientificName: "Cuminum cyminum",
        flavorProfile: { top: "강렬하고 흙내음 도는 스파이시함", mid: "은은한 견과류 뉘앙스", base: "긴 여운" },
        flavorChart: chart(5, 70, 5, 60, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "가볍게 로스팅한 뒤 침출하면 견과류 같은 고소함이 살아나 스파이스 블렌드에 깊이를 더합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "nigella",
        nameKo: "니겔라(블랙커민)",
        nameEn: "Nigella (Black Cumin)",
        scientificName: "Nigella sativa",
        flavorProfile: { top: "쌉싸름하고 화한 향", mid: "은은한 양파 뉘앙스", base: "긴 여운" },
        flavorChart: chart(5, 60, 5, 55, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "커민과는 다른 종으로, 쌉싸름하면서도 화한 독특한 향을 지녀 극소량만 사용합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "mustard-seed",
        nameKo: "머스타드씨",
        nameEn: "Mustard Seed",
        scientificName: "Sinapis alba",
        flavorProfile: { top: "톡 쏘는 매콤함", mid: "은은한 흙내음", base: "가벼운 여운" },
        flavorChart: chart(5, 55, 5, 35, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "씨앗을 살짝 으깨야 매운맛 효소가 활성화되어 톡 쏘는 스파이시함이 살아납니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "horseradish",
        nameKo: "홀스래디시",
        nameEn: "Horseradish",
        scientificName: "Armoracia rusticana",
        flavorProfile: { top: "톡 쏘는 강렬한 매운향", mid: "은은한 흙내음", base: "화한 여운" },
        flavorChart: chart(5, 60, 5, 45, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "뿌리를 갈아 낼수록 매운 성분이 활성화되므로, 침출 직전에 갈아서 사용해야 합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "wasabi",
        nameKo: "와사비",
        nameEn: "Wasabi",
        scientificName: "Eutrema japonicum",
        flavorProfile: { top: "화하고 청량한 매운향", mid: "은은한 그린 노트", base: "짧고 강렬한 여운" },
        flavorChart: chart(15, 55, 5, 30, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "휘발성 매운맛 성분이 코로 곧장 올라오는 것이 특징이라, 극히 소량만 후첨하듯 사용합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "mace",
        nameKo: "메이스(육두구 씨껍질)",
        nameEn: "Mace",
        scientificName: "Myristica fragrans",
        flavorProfile: { top: "육두구보다 섬세한 스파이스향", mid: "은은한 시트러스 뉘앙스", base: "가벼운 단맛의 여운" },
        flavorChart: chart(10, 55, 10, 40, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "육두구 씨앗을 감싼 붉은 씨껍질로, 같은 나무에서 나지만 더 섬세하고 밝은 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "burdock-root",
        nameKo: "우엉",
        nameEn: "Burdock Root",
        scientificName: "Arctium lappa",
        flavorProfile: { top: "구수하고 흙내음 도는 향", mid: "은은한 단맛", base: "깊은 여운" },
        flavorChart: chart(5, 15, 5, 75, 25),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "차로도 즐겨 마시는 뿌리로, 구수하면서도 은은한 단맛이 뿌리 계열 블렌드에 깊이를 더합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "dandelion-root",
        nameKo: "서양 민들레 뿌리",
        nameEn: "Dandelion Root",
        scientificName: "Taraxacum officinale",
        flavorProfile: { top: "쌉싸름하고 흙내음 도는 향", mid: "은은한 커피 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 70, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "로스팅하면 커피 대용으로도 쓰일 만큼 구수해지며, 쓴맛 계열 리큐르의 뼈대로 사용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "chicory-root",
        nameKo: "치커리 뿌리",
        nameEn: "Chicory Root",
        scientificName: "Cichorium intybus",
        flavorProfile: { top: "쌉싸름하고 구수한 향", mid: "은은한 커피 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 65, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "로스팅한 뿌리는 커피와 매우 유사한 향을 내, 진한 색과 쓴맛을 동시에 더합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "yellow-dock",
        nameKo: "옐로우 독",
        nameEn: "Yellow Dock",
        scientificName: "Rumex crispus",
        flavorProfile: { top: "쌉싸름한 향", mid: "은은한 신맛", base: "깊은 흙내음의 여운" },
        flavorChart: chart(10, 10, 5, 70, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "유럽 전통 비터스에서 쓴맛의 뼈대로 쓰이는 뿌리로, 은은한 신맛이 함께 느껴집니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "marshmallow-root",
        nameKo: "마시멜로우 뿌리",
        nameEn: "Marshmallow Root",
        scientificName: "Althaea officinalis",
        flavorProfile: { top: "은은하고 부드러운 향", mid: "가벼운 단맛", base: "매끄러운 여운" },
        flavorChart: chart(5, 5, 10, 40, 30),
        extraction: "냉침출 (Cold Maceration)",
        description: "점액질 성분이 풍부해 침출액의 질감을 부드럽게 만들어주는 독특한 뿌리입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "valerian-root",
        nameKo: "발레리안 뿌리",
        nameEn: "Valerian Root",
        scientificName: "Valeriana officinalis",
        flavorProfile: { top: "강렬하고 독특한 흙내음", mid: "은은한 우디함", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 85, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "향이 매우 강하고 개성이 뚜렷해 극소량만 배합해야 하는 진정 계열 허브 뿌리입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "rhubarb-root",
        nameKo: "루바브 뿌리",
        nameEn: "Rhubarb Root",
        scientificName: "Rheum palmatum",
        flavorProfile: { top: "쌉싸름하고 흙내음 도는 향", mid: "은은한 신맛", base: "깊은 여운" },
        flavorChart: chart(15, 10, 5, 65, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "식용 루바브 줄기와 달리 뿌리는 약용으로 쓰이며, 이탈리아 아마로의 전통 원료입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "quassia-bark",
        nameKo: "쿠아시아 나무껍질",
        nameEn: "Quassia Bark",
        scientificName: "Quassia amara",
        flavorProfile: { top: "극도로 강렬한 쓴맛", mid: "은은한 우디함", base: "긴 쓴맛 여운" },
        flavorChart: chart(5, 5, 5, 60, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "세계에서 가장 쓴 물질 중 하나로 꼽히는 나무껍질로, 극히 소량만으로도 강한 쓴맛을 냅니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "cascarilla-bark",
        nameKo: "카스카릴라 껍질",
        nameEn: "Cascarilla Bark",
        scientificName: "Croton eluteria",
        flavorProfile: { top: "은은하고 아로마틱한 향", mid: "가벼운 쓴맛", base: "따뜻한 우디 여운" },
        flavorChart: chart(10, 30, 10, 55, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "캄파리 등 비터스에서 향을 다듬는 데 쓰이는 껍질로, 태우면 은은한 사향 노트가 더해집니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "southernwood",
        nameKo: "서던우드",
        nameEn: "Southernwood",
        scientificName: "Artemisia abrotanum",
        flavorProfile: { top: "레몬을 닮은 허브향", mid: "은은한 쓴맛", base: "가벼운 여운" },
        flavorChart: chart(25, 10, 10, 45, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "웜우드의 친척뻘 허브지만 훨씬 순하고, 레몬을 닮은 산뜻한 뉘앙스를 지닙니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "tarragon",
        nameKo: "타라곤",
        nameEn: "Tarragon",
        scientificName: "Artemisia dracunculus",
        flavorProfile: { top: "아니스를 닮은 허브향", mid: "은은한 그린 노트", base: "가벼운 여운" },
        flavorChart: chart(10, 30, 15, 25, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "프랑스 요리에서 즐겨 쓰는 허브로, 아니스와 비슷한 향이 은은하게 배어 있습니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "marjoram",
        nameKo: "마조람",
        nameEn: "Marjoram",
        scientificName: "Origanum majorana",
        flavorProfile: { top: "달콤하고 은은한 허브향", mid: "가벼운 우디함", base: "옅은 여운" },
        flavorChart: chart(10, 15, 15, 35, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "오레가노보다 훨씬 순하고 달콤해, 배경 허브 향을 부드럽게 채우는 데 사용합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "oregano",
        nameKo: "오레가노",
        nameEn: "Oregano",
        scientificName: "Origanum vulgare",
        flavorProfile: { top: "강렬하고 흙내음 도는 허브향", mid: "은은한 스파이시함", base: "긴 여운" },
        flavorChart: chart(10, 25, 10, 50, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "마조람보다 훨씬 강렬하고 거친 인상을 주어, 짧은 증기 주입으로만 배경에 깔아줍니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "sweet-basil",
        nameKo: "스위트 바질",
        nameEn: "Sweet Basil",
        scientificName: "Ocimum basilicum",
        flavorProfile: { top: "달콤하고 그린한 허브향", mid: "은은한 아니스 뉘앙스", base: "가벼운 여운" },
        flavorChart: chart(15, 20, 25, 15, 15),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "제노바 품종 바질로, 태국 바질보다 부드럽고 달콤한 인상을 남깁니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "dill",
        nameKo: "딜",
        nameEn: "Dill",
        scientificName: "Anethum graveolens",
        flavorProfile: { top: "상쾌하고 아니스를 닮은 향", mid: "은은한 그린 노트", base: "가벼운 여운" },
        flavorChart: chart(15, 25, 10, 20, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "북유럽 아쿠아비트에서 흔히 쓰이는 허브로, 상쾌하고 산뜻한 아니스 계열 향을 냅니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "parsley",
        nameKo: "파슬리",
        nameEn: "Parsley",
        scientificName: "Petroselinum crispum",
        flavorProfile: { top: "신선한 그린향", mid: "은은한 후추 뉘앙스", base: "가벼운 여운" },
        flavorChart: chart(15, 20, 10, 20, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "가장 흔하지만 신선한 그린 노트를 더할 때 의외로 유용한 배경 허브입니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "chervil",
        nameKo: "처빌",
        nameEn: "Chervil",
        scientificName: "Anthriscus cerefolium",
        flavorProfile: { top: "은은한 아니스 향", mid: "가벼운 그린 노트", base: "옅은 여운" },
        flavorChart: chart(10, 20, 10, 15, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "파슬리와 아니스 사이의 섬세한 향을 지녀, 프랑스 요리의 '고운 허브' 중 하나로 꼽힙니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "savory",
        nameKo: "세이보리",
        nameEn: "Savory",
        scientificName: "Satureja hortensis",
        flavorProfile: { top: "타임과 후추 사이의 향", mid: "은은한 스파이시함", base: "가벼운 여운" },
        flavorChart: chart(10, 40, 10, 30, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "타임과 후추의 중간 지점에 있는 향으로, 허브 블렌드에 매콤한 악센트를 더합니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "hyssop",
        nameKo: "히솝",
        nameEn: "Hyssop",
        scientificName: "Hyssopus officinalis",
        flavorProfile: { top: "쌉싸름하고 민트를 닮은 향", mid: "은은한 아니스 뉘앙스", base: "긴 여운" },
        flavorChart: chart(10, 30, 15, 30, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "샤르트뢰즈 등 수도원 리큐르의 전통 원료로, 쌉싸름하면서도 향긋한 개성을 지닙니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "vervain",
        nameKo: "버베인(마편초)",
        nameEn: "Vervain",
        scientificName: "Verbena officinalis",
        flavorProfile: { top: "은은한 그린 허브향", mid: "가벼운 쓴맛", base: "옅은 여운" },
        flavorChart: chart(15, 10, 15, 30, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "레몬버베나와는 다른 종으로, 시트러스 향 없이 은은하고 쌉싸름한 허브차 원료로 쓰입니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "blackcurrant-bud",
        nameKo: "블랙커런트 새순",
        nameEn: "Blackcurrant Bud",
        scientificName: "Ribes nigrum",
        flavorProfile: { top: "짙고 캣시(Catty)한 베리향", mid: "은은한 그린 노트", base: "깊은 여운" },
        flavorChart: chart(20, 5, 20, 30, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "프랑스 카시스 리큐르의 원료로, 열매보다 새순에서 훨씬 짙고 개성 강한 향이 납니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "raspberry-leaf",
        nameKo: "라즈베리 잎",
        nameEn: "Raspberry Leaf",
        scientificName: "Rubus idaeus",
        flavorProfile: { top: "은은한 그린·베리 뉘앙스", mid: "가벼운 떫은맛", base: "옅은 여운" },
        flavorChart: chart(15, 5, 15, 30, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "열매보다 은은하지만, 허브차처럼 우려내면 부드러운 베리 인상을 더할 수 있습니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "blackberry-leaf",
        nameKo: "블랙베리 잎",
        nameEn: "Blackberry Leaf",
        scientificName: "Rubus fruticosus",
        flavorProfile: { top: "은은한 그린 노트", mid: "가벼운 떫은맛", base: "옅은 여운" },
        flavorChart: chart(10, 5, 10, 35, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "유럽에서 전시 홍차 대용으로 쓰였던 잎으로, 은은한 떫은맛이 배경을 잡아줍니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "elderberry",
        nameKo: "엘더베리",
        nameEn: "Elderberry",
        scientificName: "Sambucus nigra",
        flavorProfile: { top: "짙고 새콤한 베리향", mid: "은은한 흙내음", base: "깊은 여운" },
        flavorChart: chart(20, 5, 15, 30, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "꽃과 같은 나무에서 나지만 열매는 훨씬 짙고 새콤해, 가열 침출로 안전하게 사용해야 합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "sea-buckthorn",
        nameKo: "산자나무 열매",
        nameEn: "Sea Buckthorn",
        scientificName: "Hippophae rhamnoides",
        flavorProfile: { top: "강렬한 산미와 열대과일향", mid: "은은한 오렌지 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(60, 5, 10, 20, 20),
        extraction: "냉침출 (Cold Maceration)",
        description: "망고와 오렌지 사이의 독특한 향을 지닌 강렬한 산미의 베리로, 소량만 사용합니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "rosehip",
        nameKo: "로즈힙",
        nameEn: "Rosehip",
        scientificName: "Rosa canina",
        flavorProfile: { top: "새콤하고 은은한 과일향", mid: "가벼운 꽃 뉘앙스", base: "부드러운 여운" },
        flavorChart: chart(35, 5, 30, 15, 30),
        extraction: "냉침출 (Cold Maceration)",
        description: "장미의 열매로, 꽃과는 다른 새콤하고 은은한 과일 향을 지녀 허브차에도 즐겨 쓰입니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "sloe-berry",
        nameKo: "슬로베리(블랙손 열매)",
        nameEn: "Sloe Berry",
        scientificName: "Prunus spinosa",
        flavorProfile: { top: "떫고 새콤한 자두향", mid: "은은한 아몬드 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(30, 5, 10, 25, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "영국 슬로진의 핵심 원료로, 생으로는 떫지만 장기 침출하면 깊은 자두 향이 우러납니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "bilberry",
        nameKo: "빌베리",
        nameEn: "Bilberry",
        scientificName: "Vaccinium myrtillus",
        flavorProfile: { top: "짙고 달콤한 베리향", mid: "은은한 산미", base: "깊은 여운" },
        flavorChart: chart(15, 5, 10, 25, 35),
        extraction: "냉침출 (Cold Maceration)",
        description: "블루베리의 야생 친척뻘 열매로, 훨씬 짙고 새콤달콤한 향을 냅니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "cranberry",
        nameKo: "크랜베리",
        nameEn: "Cranberry",
        scientificName: "Vaccinium macrocarpon",
        flavorProfile: { top: "강렬한 산미와 베리향", mid: "은은한 떫은맛", base: "깊은 여운" },
        flavorChart: chart(30, 5, 10, 20, 20),
        extraction: "냉침출 (Cold Maceration)",
        description: "산미가 매우 강해 단맛 계열 원료와 균형을 맞춰야 하는 대표적인 새콤한 베리입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "quince",
        nameKo: "마르멜로(모과사촌)",
        nameEn: "Quince",
        scientificName: "Cydonia oblonga",
        flavorProfile: { top: "은은하고 화사한 과일향", mid: "가벼운 꽃 뉘앙스", base: "깊은 단맛의 여운" },
        flavorChart: chart(25, 5, 25, 15, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "생으로는 떫지만 가열하면 은은하고 화사한 향이 살아나는 서양 모과입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "frankincense",
        nameKo: "프랑킨센스(유향)",
        nameEn: "Frankincense",
        scientificName: "Boswellia sacra",
        flavorProfile: { top: "은은한 시트러스·수지향", mid: "가벼운 스파이시함", base: "깊은 우디 여운" },
        flavorChart: chart(20, 15, 10, 70, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "고대부터 향료로 쓰인 나무 수지로, 은은한 시트러스 뉘앙스가 섞인 독특한 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "myrrh",
        nameKo: "미르(몰약)",
        nameEn: "Myrrh",
        scientificName: "Commiphora myrrha",
        flavorProfile: { top: "쌉싸름하고 약재 같은 향", mid: "은은한 스모키함", base: "깊은 여운" },
        flavorChart: chart(5, 15, 5, 75, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "유향과 함께 고대부터 쓰인 수지로, 훨씬 쌉싸름하고 약재에 가까운 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "cedarwood",
        nameKo: "시더우드",
        nameEn: "Cedarwood",
        scientificName: "Cedrus atlantica",
        flavorProfile: { top: "따뜻하고 부드러운 우디향", mid: "은은한 연필심 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 80, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "샌달우드보다 건조하고 연필심을 닮은 향을 지녀, 위스키 숙성 원료와 잘 어울립니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "birch-bark",
        nameKo: "자작나무 껍질",
        nameEn: "Birch Bark",
        scientificName: "Betula pendula",
        flavorProfile: { top: "은은한 스모키함", mid: "가벼운 민트 뉘앙스", base: "깊은 우디 여운" },
        flavorChart: chart(5, 10, 5, 70, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "타르를 연상시키는 은은한 스모키함을 지녀, 북유럽 스타일 스피릿에 개성을 더합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "oak-chips",
        nameKo: "오크칩(토스트)",
        nameEn: "Toasted Oak Chips",
        scientificName: "Quercus alba",
        flavorProfile: { top: "바닐라·캐러멜 향", mid: "은은한 스파이시함", base: "깊은 우디 여운" },
        flavorChart: chart(5, 15, 5, 65, 40),
        extraction: "냉침출 (Cold Maceration)",
        description: "오크통 숙성과 유사한 효과를 빠르게 얻기 위해 사용하는 토스트 오크 조각입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "guaiac-wood",
        nameKo: "구아이악 우드",
        nameEn: "Guaiac Wood",
        scientificName: "Bulnesia sarmientoi",
        flavorProfile: { top: "장미를 닮은 우디향", mid: "은은한 스모키함", base: "깊은 여운" },
        flavorChart: chart(5, 5, 20, 75, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "우디하면서도 장미를 연상시키는 독특한 이중적 향을 지닌 남미산 목재입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "vetiver",
        nameKo: "베티버",
        nameEn: "Vetiver",
        scientificName: "Chrysopogon zizanioides",
        flavorProfile: { top: "흙내음 도는 그린·우디향", mid: "은은한 스모키함", base: "깊은 여운" },
        flavorChart: chart(5, 10, 10, 85, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "뿌리에서 얻는 향으로, 젖은 흙과 나무가 섞인 깊고 어두운 인상을 남깁니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "patchouli",
        nameKo: "파촐리",
        nameEn: "Patchouli",
        scientificName: "Pogostemon cablin",
        flavorProfile: { top: "짙고 흙내음 도는 향", mid: "은은한 스위트 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 10, 80, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "향이 매우 강렬하고 오래 남아, 극소량만으로도 블렌드 전체의 무게중심을 잡을 수 있습니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "oakmoss",
        nameKo: "오크모스",
        nameEn: "Oakmoss",
        scientificName: "Evernia prunastri",
        flavorProfile: { top: "축축한 숲을 닮은 향", mid: "은은한 가죽 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 5, 5, 85, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "나무에 자라는 지의류로, 비 온 뒤 숲을 연상시키는 깊고 축축한 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "labdanum",
        nameKo: "라다넘(록로즈 수지)",
        nameEn: "Labdanum",
        scientificName: "Cistus ladanifer",
        flavorProfile: { top: "가죽을 닮은 짙은 향", mid: "은은한 앰버 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 10, 70, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "지중해 관목에서 얻는 수지로, 가죽과 앰버를 닮은 짙고 관능적인 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "black-tea",
        nameKo: "홍차",
        nameEn: "Black Tea",
        scientificName: "Camellia sinensis",
        flavorProfile: { top: "짙고 몰티한 향", mid: "은은한 떫은맛", base: "깊은 여운" },
        flavorChart: chart(15, 5, 15, 40, 20),
        extraction: "냉침출 (Cold Maceration)",
        description: "완전 발효를 거쳐 녹차와는 전혀 다른 짙고 몰티한 향을 내는 찻잎입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "oolong-tea",
        nameKo: "우롱차",
        nameEn: "Oolong Tea",
        scientificName: "Camellia sinensis",
        flavorProfile: { top: "복숭아를 닮은 은은한 향", mid: "가벼운 꽃 뉘앙스", base: "부드러운 여운" },
        flavorChart: chart(15, 5, 25, 25, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "반발효차 특유의 복숭아·꽃을 닮은 복합적인 향이 특징입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "hojicha",
        nameKo: "호지차(볶은 녹차)",
        nameEn: "Hojicha",
        scientificName: "Camellia sinensis",
        flavorProfile: { top: "고소하고 스모키한 향", mid: "은은한 캐러멜 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 55, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "녹차를 강하게 볶아 카페인은 줄고 고소한 로스티함이 살아난 찻잎입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "yerba-mate",
        nameKo: "예르바 마테",
        nameEn: "Yerba Mate",
        scientificName: "Ilex paraguariensis",
        flavorProfile: { top: "풋풋하고 쌉싸름한 향", mid: "은은한 스모키함", base: "깊은 여운" },
        flavorChart: chart(10, 5, 5, 55, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "남미에서 즐겨 마시는 잎으로, 녹차보다 거칠고 스모키한 쓴맛을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "rooibos",
        nameKo: "루이보스",
        nameEn: "Rooibos",
        scientificName: "Aspalathus linearis",
        flavorProfile: { top: "은은하고 달콤한 향", mid: "가벼운 우디함", base: "부드러운 여운" },
        flavorChart: chart(5, 10, 10, 45, 35),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "카페인이 없는 남아프리카산 잎으로, 은은하고 달콤한 레드부시 향을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "coffee-bean",
        nameKo: "커피 원두",
        nameEn: "Coffee Bean",
        scientificName: "Coffea arabica",
        flavorProfile: { top: "짙고 로스티한 향", mid: "은은한 쓴맛", base: "깊은 여운" },
        flavorChart: chart(5, 10, 5, 60, 30),
        extraction: "냉침출 (Cold Maceration)",
        description: "갓 로스팅한 원두를 저온 침출하면 향은 살리고 과도한 쓴맛은 줄일 수 있습니다.",
        relatedProduct: "ZENTARO BLUE RESERVE",
    },
    {
        id: "roasted-barley",
        nameKo: "볶은 보리",
        nameEn: "Roasted Barley",
        scientificName: "Hordeum vulgare",
        flavorProfile: { top: "구수한 곡물향", mid: "은은한 캐러멜 뉘앙스", base: "부드러운 여운" },
        flavorChart: chart(0, 5, 5, 50, 25),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "보리차처럼 볶아 침출하면 위스키 베이스와 자연스럽게 어우러지는 구수함을 더합니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "toasted-oat",
        nameKo: "볶은 귀리",
        nameEn: "Toasted Oat",
        scientificName: "Avena sativa",
        flavorProfile: { top: "고소하고 크리미한 향", mid: "은은한 단맛", base: "부드러운 여운" },
        flavorChart: chart(0, 5, 5, 35, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "볶은 귀리 특유의 고소하고 크리미한 질감을 더해 곡물 스피릿의 바디감을 살립니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "danggui",
        nameKo: "참당귀",
        nameEn: "Korean Angelica (Danggui)",
        scientificName: "Angelica gigas",
        flavorProfile: { top: "짙고 흙내음 도는 향", mid: "은은한 스위트 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 15, 5, 80, 20),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "유럽산 안젤리카 루트, 중국산 백지와 모두 다른 한국 자생종으로, 한방 보양주에 흔히 쓰입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "bokbunja",
        nameKo: "복분자",
        nameEn: "Korean Black Raspberry (Bokbunja)",
        scientificName: "Rubus coreanus",
        flavorProfile: { top: "짙고 달콤한 베리향", mid: "은은한 산미", base: "깊은 여운" },
        flavorChart: chart(20, 5, 10, 20, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "복분자주로 잘 알려진 한국 전통 열매로, 짙고 달콤한 베리 향을 냅니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "jobs-tears",
        nameKo: "율무",
        nameEn: "Job's Tears",
        scientificName: "Coix lacryma-jobi",
        flavorProfile: { top: "구수한 곡물향", mid: "은은한 단맛", base: "부드러운 여운" },
        flavorChart: chart(0, 5, 5, 40, 25),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "율무차로 익숙한 곡물로, 볶은 뒤 침출하면 구수하고 부드러운 곡물향을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "acanthopanax",
        nameKo: "오갈피",
        nameEn: "Acanthopanax",
        scientificName: "Eleutherococcus senticosus",
        flavorProfile: { top: "쌉싸름하고 흙내음 도는 향", mid: "은은한 스파이시함", base: "깊은 여운" },
        flavorChart: chart(5, 20, 5, 85, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "시베리아 인삼으로도 불리는 강장 나무껍질로, 한국 전통 오갈피주의 핵심 원료입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "astragalus-root",
        nameKo: "황기",
        nameEn: "Astragalus Root",
        scientificName: "Astragalus membranaceus",
        flavorProfile: { top: "은은하고 달콤한 콩향", mid: "가벼운 흙내음", base: "부드러운 여운" },
        flavorChart: chart(5, 10, 5, 55, 30),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "삼계탕에도 들어가는 익숙한 약재 뿌리로, 은은하고 달콤한 콩 비슷한 향을 냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "wild-chrysanthemum",
        nameKo: "감국(들국화)",
        nameEn: "Wild Chrysanthemum",
        scientificName: "Chrysanthemum indicum",
        flavorProfile: { top: "진하고 쌉싸름한 국화향", mid: "은은한 허브 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(10, 10, 65, 30, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "재배 국화보다 훨씬 진하고 쌉싸름해, 약차로 즐겨 쓰이는 한국 자생 들국화입니다.",
        relatedProduct: "ZENTARO Floral Gin",
    },
    {
        id: "mulberry-leaf",
        nameKo: "뽕잎",
        nameEn: "Mulberry Leaf",
        scientificName: "Morus alba",
        flavorProfile: { top: "은은한 풀내음", mid: "가벼운 단맛", base: "부드러운 여운" },
        flavorChart: chart(5, 5, 10, 35, 20),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "누에의 먹이로도 유명한 잎으로, 차로 덖으면 은은하고 부드러운 풀향을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "persimmon-leaf",
        nameKo: "감잎",
        nameEn: "Persimmon Leaf",
        scientificName: "Diospyros kaki",
        flavorProfile: { top: "은은한 풀내음", mid: "가벼운 떫은맛", base: "부드러운 여운" },
        flavorChart: chart(5, 5, 10, 40, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "감잎차로 익숙한 잎으로, 은은한 떫은맛이 배경 향의 무게를 잡아줍니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "bamboo-leaf",
        nameKo: "죽엽",
        nameEn: "Bamboo Leaf",
        scientificName: "Phyllostachys nigra",
        flavorProfile: { top: "청량하고 은은한 그린향", mid: "가벼운 풀내음", base: "깨끗한 여운" },
        flavorChart: chart(10, 5, 10, 30, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "죽엽청주 등 중화권 전통주에서 즐겨 쓰이는 잎으로, 청량하고 깨끗한 그린 노트를 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "lotus-leaf",
        nameKo: "연잎",
        nameEn: "Lotus Leaf",
        scientificName: "Nelumbo nucifera",
        flavorProfile: { top: "은은하고 풋풋한 그린향", mid: "가벼운 차 뉘앙스", base: "부드러운 여운" },
        flavorChart: chart(10, 5, 30, 25, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "연꽃과 같은 식물이지만 잎에서는 훨씬 풋풋하고 차(茶)에 가까운 향이 우러납니다.",
        relatedProduct: "ZENTARO Lotus Gin",
    },
    {
        id: "vietnamese-cardamom",
        nameKo: "사인(베트남 카다멈)",
        nameEn: "Vietnamese Cardamom (Sa Nhân)",
        scientificName: "Amomum villosum",
        flavorProfile: { top: "화한 아로마틱 향", mid: "은은한 장뇌 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(15, 65, 10, 35, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "그린 카다멈과는 다른 종으로, 베트남 산간에서 나는 훨씬 화하고 장뇌 같은 향을 냅니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "ceylon-cinnamon",
        nameKo: "실론 계피(진짜 계피)",
        nameEn: "Ceylon Cinnamon (True Cinnamon)",
        scientificName: "Cinnamomum verum",
        flavorProfile: { top: "섬세하고 달콤한 나무껍질 향", mid: "은은한 시트러스 뉘앙스", base: "부드러운 여운" },
        flavorChart: chart(10, 60, 10, 35, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "기존 카시아 계피보다 섬세하고 달콤하며, '진짜 계피'로 불리는 스리랑카산 품종입니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "curry-leaf",
        nameKo: "커리잎",
        nameEn: "Curry Leaf",
        scientificName: "Murraya koenigii",
        flavorProfile: { top: "강렬하고 독특한 향신향", mid: "은은한 시트러스 뉘앙스", base: "긴 여운" },
        flavorChart: chart(20, 45, 10, 30, 5),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "커리 특유의 향을 내는 잎으로, 짧은 증기 주입만으로도 이국적인 개성을 더합니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "passionfruit-leaf",
        nameKo: "패션프루트 잎",
        nameEn: "Passionfruit Leaf",
        scientificName: "Passiflora edulis",
        flavorProfile: { top: "은은한 그린·과일 뉘앙스", mid: "가벼운 허브향", base: "부드러운 여운" },
        flavorChart: chart(20, 5, 10, 25, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "열매만큼 강렬하지는 않지만, 잎에서도 은은한 트로피컬 뉘앙스가 느껴집니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "soursop-leaf",
        nameKo: "그라비올라 잎(soursop)",
        nameEn: "Soursop Leaf",
        scientificName: "Annona muricata",
        flavorProfile: { top: "은은한 그린향", mid: "가벼운 쓴맛", base: "부드러운 여운" },
        flavorChart: chart(10, 5, 10, 40, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "동남아에서 차로 즐겨 마시는 잎으로, 은은한 쓴맛과 그린 노트를 배경에 더합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "guava-leaf",
        nameKo: "구아바 잎",
        nameEn: "Guava Leaf",
        scientificName: "Psidium guajava",
        flavorProfile: { top: "은은한 과일·그린향", mid: "가벼운 떫은맛", base: "부드러운 여운" },
        flavorChart: chart(15, 5, 10, 35, 15),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "열매의 화사함 대신 은은한 떫은맛과 그린 노트를 지닌 배경형 원료입니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "tamarind",
        nameKo: "타마린드",
        nameEn: "Tamarind",
        scientificName: "Tamarindus indica",
        flavorProfile: { top: "강렬한 새콤달콤함", mid: "은은한 캐러멜 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(40, 10, 5, 25, 45),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "새콤달콤함이 동시에 강렬한 열대과일로, 산미와 단맛의 균형추 역할을 합니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "star-fruit",
        nameKo: "스타프루트(카람볼라)",
        nameEn: "Star Fruit",
        scientificName: "Averrhoa carambola",
        flavorProfile: { top: "상큼하고 은은한 과일향", mid: "가벼운 산미", base: "깨끗한 여운" },
        flavorChart: chart(45, 5, 10, 10, 25),
        extraction: "냉침출 (Cold Maceration)",
        description: "사과와 포도 사이 어딘가의 향을 지닌 열대과일로, 상큼하고 깨끗한 인상을 남깁니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "fig-leaf",
        nameKo: "무화과 잎",
        nameEn: "Fig Leaf",
        scientificName: "Ficus carica",
        flavorProfile: { top: "코코넛을 닮은 은은한 향", mid: "가벼운 그린 노트", base: "부드러운 여운" },
        flavorChart: chart(10, 5, 15, 35, 20),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "열매보다 잎에서 코코넛을 닮은 독특한 향이 나, 짧은 증기 주입으로 그 뉘앙스만 담아냅니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "pomegranate",
        nameKo: "석류",
        nameEn: "Pomegranate",
        scientificName: "Punica granatum",
        flavorProfile: { top: "새콤달콤한 베리향", mid: "은은한 떫은맛", base: "깊은 여운" },
        flavorChart: chart(35, 5, 10, 20, 35),
        extraction: "냉침출 (Cold Maceration)",
        description: "껍질과 과육 모두 사용 가능하며, 새콤달콤함과 은은한 떫은맛이 공존합니다.",
        relatedProduct: "ZENTARO RUBY",
    },
    {
        id: "echinacea",
        nameKo: "에키네시아",
        nameEn: "Echinacea",
        scientificName: "Echinacea purpurea",
        flavorProfile: { top: "은은한 그린향", mid: "가벼운 얼얼함", base: "부드러운 여운" },
        flavorChart: chart(5, 15, 20, 30, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "혀끝이 살짝 얼얼해지는 독특한 감각이 특징인 면역 강장 허브입니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "st-johns-wort",
        nameKo: "세인트존스워트",
        nameEn: "St. John's Wort",
        scientificName: "Hypericum perforatum",
        flavorProfile: { top: "은은하고 쌉싸름한 향", mid: "가벼운 허브 뉘앙스", base: "옅은 여운" },
        flavorChart: chart(10, 10, 35, 25, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "노란 꽃이 피는 허브로, 은은하고 쌉싸름한 향이 허브 리큐르에 개성을 더합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "milk-thistle",
        nameKo: "밀크씨슬",
        nameEn: "Milk Thistle",
        scientificName: "Silybum marianum",
        flavorProfile: { top: "은은한 쓴맛", mid: "가벼운 견과류 뉘앙스", base: "옅은 여운" },
        flavorChart: chart(5, 10, 5, 40, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "씨앗을 침출하면 은은한 쓴맛과 함께 가벼운 견과류 뉘앙스가 우러납니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "ginkgo-leaf",
        nameKo: "은행잎",
        nameEn: "Ginkgo Leaf",
        scientificName: "Ginkgo biloba",
        flavorProfile: { top: "은은한 그린향", mid: "가벼운 쓴맛", base: "옅은 여운" },
        flavorChart: chart(5, 5, 10, 40, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "가을 은행잎을 말려 침출하면 은은한 그린 노트와 쓴맛이 배경에 깔립니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "ashwagandha",
        nameKo: "아쉬와간다",
        nameEn: "Ashwagandha",
        scientificName: "Withania somnifera",
        flavorProfile: { top: "쌉싸름하고 흙내음 도는 향", mid: "은은한 스파이시함", base: "깊은 여운" },
        flavorChart: chart(5, 20, 5, 75, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "인도 전통 강장 뿌리로, 쌉싸름하고 흙내음 도는 묵직한 인상을 남깁니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "holy-basil",
        nameKo: "홀리바질(툴시)",
        nameEn: "Holy Basil (Tulsi)",
        scientificName: "Ocimum tenuiflorum",
        flavorProfile: { top: "화한 정향을 닮은 향", mid: "은은한 민트 뉘앙스", base: "긴 여운" },
        flavorChart: chart(10, 40, 20, 20, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "스위트 바질·타이 바질과는 다른 종으로, 정향을 닮은 화한 향이 특징입니다.",
        relatedProduct: "ZENTARO Blue Dry Gin",
    },
    {
        id: "neem",
        nameKo: "님(인도 멀구슬나무)",
        nameEn: "Neem",
        scientificName: "Azadirachta indica",
        flavorProfile: { top: "극도로 쓴 향", mid: "은은한 흙내음", base: "긴 쓴맛 여운" },
        flavorChart: chart(5, 5, 5, 60, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "인도 전통 의학에서 쓰이는 매우 쓴 잎으로, 극소량만 시험적으로 사용합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "moringa-leaf",
        nameKo: "모링가 잎",
        nameEn: "Moringa Leaf",
        scientificName: "Moringa oleifera",
        flavorProfile: { top: "은은한 그린·풀향", mid: "가벼운 쓴맛", base: "부드러운 여운" },
        flavorChart: chart(5, 10, 10, 45, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "'기적의 나무'로 불리는 잎으로, 말차와 비슷한 은은한 그린 향을 냅니다.",
        relatedProduct: "ZENTARO Distilled Soju",
    },
    {
        id: "fenugreek",
        nameKo: "호로파",
        nameEn: "Fenugreek",
        scientificName: "Trigonella foenum-graecum",
        flavorProfile: { top: "메이플시럽을 닮은 향", mid: "은은한 쓴맛", base: "깊은 여운" },
        flavorChart: chart(5, 20, 5, 45, 40),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "씨앗을 가볍게 로스팅하면 메이플시럽을 닮은 독특한 단향이 살아납니다.",
        relatedProduct: "ZENTARO Whisky",
    },
    {
        id: "nettle-leaf",
        nameKo: "쐐기풀 잎",
        nameEn: "Nettle Leaf",
        scientificName: "Urtica dioica",
        flavorProfile: { top: "은은한 그린향", mid: "가벼운 흙내음", base: "옅은 여운" },
        flavorChart: chart(5, 5, 5, 45, 5),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "가열하면 쏘는 성질이 사라지고, 시금치를 닮은 은은한 그린 향만 남습니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "myrtle",
        nameKo: "머틀(도금양)",
        nameEn: "Myrtle",
        scientificName: "Myrtus communis",
        flavorProfile: { top: "상쾌하고 수지 같은 향", mid: "은은한 유칼립투스 뉘앙스", base: "가벼운 여운" },
        flavorChart: chart(15, 15, 25, 40, 10),
        extraction: "증기 주입법 (Vapor Infusion)",
        description: "지중해 관목으로, 주니퍼와 유칼립투스 사이의 상쾌한 향을 냅니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "caper-buds",
        nameKo: "케이퍼 봉오리",
        nameEn: "Caper Buds",
        scientificName: "Capparis spinosa",
        flavorProfile: { top: "톡 쏘는 짭짤한 향", mid: "은은한 그린 노트", base: "가벼운 여운" },
        flavorChart: chart(15, 20, 10, 35, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "소금에 절인 봉오리를 헹궈 침출하면 톡 쏘는 짭짤하고 독특한 향을 얻을 수 있습니다.",
        relatedProduct: "ZENTARO Original Dry Gin",
    },
    {
        id: "sumac",
        nameKo: "수맥(옻나무 열매)",
        nameEn: "Sumac",
        scientificName: "Rhus coriaria",
        flavorProfile: { top: "강렬한 산미", mid: "은은한 과일 뉘앙스", base: "깨끗한 여운" },
        flavorChart: chart(45, 10, 5, 20, 10),
        extraction: "냉침출 (Cold Maceration)",
        description: "중동 요리에서 레몬 대신 쓰는 향신료로, 강렬한 산미가 시트러스를 대신할 수 있습니다.",
        relatedProduct: "ZENTARO Citrus Gin",
    },
    {
        id: "mastic",
        nameKo: "마스틱(키오스 유향수지)",
        nameEn: "Mastic",
        scientificName: "Pistacia lentiscus",
        flavorProfile: { top: "은은한 소나무·시더향", mid: "가벼운 아니스 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(10, 15, 5, 55, 15),
        extraction: "냉침출 (Cold Maceration)",
        description: "그리스 키오스섬 특산 수지로, 은은한 소나무 향이 리큐르에 독특한 개성을 더합니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "elecampane",
        nameKo: "엘레캄페인",
        nameEn: "Elecampane",
        scientificName: "Inula helenium",
        flavorProfile: { top: "쌉싸름하고 흙내음 도는 향", mid: "은은한 바이올렛 뉘앙스", base: "깊은 여운" },
        flavorChart: chart(5, 10, 15, 70, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "베르무트의 전통 원료 중 하나로, 쌉싸름한 뿌리향 속에 은은한 꽃 뉘앙스가 숨어 있습니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "centaury",
        nameKo: "센토리",
        nameEn: "Centaury",
        scientificName: "Centaurium erythraea",
        flavorProfile: { top: "매우 강렬한 쓴맛", mid: "은은한 꽃 뉘앙스", base: "긴 여운" },
        flavorChart: chart(5, 5, 20, 55, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "유럽 전통 비터스에서 쓴맛의 기준점으로 꼽히는 작은 분홍 꽃 허브입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "angostura-bark",
        nameKo: "앙고스투라 나무껍질",
        nameEn: "Angostura Bark",
        scientificName: "Galipea officinalis",
        flavorProfile: { top: "쌉싸름하고 아로마틱한 향", mid: "은은한 스파이시함", base: "깊은 여운" },
        flavorChart: chart(10, 30, 5, 60, 10),
        extraction: "직접 침출 및 가열 (Maceration & Boiling)",
        description: "앙고스투라 비터스의 이름을 딴 나무껍질로, 쌉싸름함과 스파이시함이 함께 우러납니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
    {
        id: "cascara-sagrada",
        nameKo: "카스카라 사그라다",
        nameEn: "Cascara Sagrada",
        scientificName: "Frangula purshiana",
        flavorProfile: { top: "강렬하고 쌉싸름한 향", mid: "은은한 우디함", base: "긴 여운" },
        flavorChart: chart(5, 10, 5, 65, 5),
        extraction: "냉침출 (Cold Maceration)",
        description: "'신성한 껍질'이라는 이름대로 전통적으로 귀하게 다뤄진 강한 쓴맛의 북미산 나무껍질입니다.",
        relatedProduct: "BANJJAC 리큐르",
    },
]

export default function BotanicalArchive() {
    const router = useRouter()
    const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
    const [selected, setSelected] = useState<Botanical | null>(null)
    const [mixIds, setMixIds] = useState<Set<string>>(new Set())
    const [showMix, setShowMix] = useState(false)
    const [target, setTarget] = useState<BalanceTarget>(DEFAULT_TARGET)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => onAuthChanged(() => setLoggedIn(Boolean(getToken()))), [])

    const { thumbnail: selectedThumbnail, pageUrl: selectedPageUrl, ref: selectedThumbRef } = useWikipediaThumbnail(
        selected?.scientificName ?? "",
    )

    const filteredBotanicals = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return botanicalData
        return botanicalData.filter(
            (b) =>
                b.nameKo.toLowerCase().includes(q) ||
                b.nameEn.toLowerCase().includes(q) ||
                b.scientificName.toLowerCase().includes(q) ||
                b.relatedProduct.toLowerCase().includes(q),
        )
    }, [searchQuery])

    const axisTarget = useMemo(() => toAxisTarget(target), [target])
    const recommended = useMemo(() => recommendBlend(axisTarget), [axisTarget])
    const recommendedAvg = useMemo(() => axisAverages(recommended), [recommended])
    const compareChart = useMemo(
        () =>
            AXES.map((axis) => ({
                subject: axis,
                Target: Math.round(axisTarget[axis]),
                Blend: Math.round(recommendedAvg[axis]),
                fullMark: 100,
            })),
        [axisTarget, recommendedAvg],
    )

    function toggleMix(id: string, e: MouseEvent) {
        e.stopPropagation()
        if (!loggedIn) {
            router.push(`/my/profile?next=${encodeURIComponent("/about/research-lab#botanical-library")}`)
            return
        }
        setMixIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const mixSelection = botanicalData.filter((b) => mixIds.has(b.id))
    const mixChart = computeMixChart(mixSelection)

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
                    젠타로 증류소의 비밀 실험실에서 엄선한 보태니컬 원료 {botanicalData.length}종의 향미 구조와 추출 비법을
                    기록합니다. 카드를 눌러 자세히 탐구하거나, 원 모양 버튼으로 여러 원료를 골라 믹스 결과를 미리 볼 수 있습니다.
                </p>
            </div>

            {/* Balance Recommender */}
            <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-500">Balance Recommender</p>
                </div>
                <h2 className="mt-2 font-serif text-xl font-semibold text-slate-50">밸런스 추천 배합</h2>
                <p className="mt-1 text-sm text-slate-400">
                    원하는 향미 밸런스를 슬라이더로 조정하면 {botanicalData.length}종의 데이터베이스에서 가장 가까운 배합을
                    실시간으로 추천합니다.
                </p>

                {loggedIn ? (
                    <>
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {SLIDER_DEFS.map(({ key, label }) => (
                                <label key={key} className="block text-xs text-slate-400">
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="font-medium uppercase tracking-wider text-slate-300">{label}</span>
                                        <span className="font-mono text-amber-400">{target[key]}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={target[key]}
                                        onChange={(e) => setTarget((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                                        className="w-full accent-amber-500"
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="h-56 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={compareChart} outerRadius="75%">
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                                        <Radar
                                            name="목표"
                                            dataKey="Target"
                                            stroke="#64748b"
                                            fill="#64748b"
                                            fillOpacity={0.12}
                                            strokeWidth={1.5}
                                            strokeDasharray="4 3"
                                        />
                                        <Radar name="추천 배합" dataKey="Blend" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">추천 원료 ({recommended.length}종)</p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {recommended.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setSelected(b)}
                                            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300 transition-colors hover:border-amber-500/60"
                                        >
                                            {b.nameEn}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMixIds(new Set(recommended.map((b) => b.id)))
                                        setShowMix(true)
                                    }}
                                    className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-opacity hover:opacity-90"
                                >
                                    <FlaskRound className="h-3.5 w-3.5" />
                                    이 배합 자세히 보기
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mt-6">
                        <MemberFeatureLock
                            title="밸런스 추천 배합은 회원 전용 기능입니다"
                            description="로그인하시면 슬라이더로 원하는 향미를 조정해 실시간 추천 배합과 레이더 차트를 확인하실 수 있습니다."
                            nextPath="/about/research-lab#botanical-library"
                        />
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="mx-auto mt-12 max-w-2xl">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="원료명 또는 학명으로 검색 (예: 히비스커스, Citrus, 계피)"
                        className="w-full rounded-full border border-slate-700/60 bg-slate-800 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/60 focus:outline-none"
                    />
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            aria-label="검색어 지우기"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                    {searchQuery ? `${filteredBotanicals.length}종 검색됨` : `총 ${botanicalData.length}종 수록`}
                </p>
            </div>

            {/* Grid */}
            <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBotanicals.length === 0 ? (
                    <p className="col-span-full text-center text-sm text-slate-500">검색 결과가 없습니다.</p>
                ) : null}
                {filteredBotanicals.map((botanical, index) => (
                    <BotanicalCard
                        key={botanical.id}
                        botanical={botanical}
                        index={index}
                        isMixed={mixIds.has(botanical.id)}
                        loggedIn={loggedIn}
                        onSelect={setSelected}
                        onToggleMix={toggleMix}
                    />
                ))}
            </div>

            {/* Mix selection bar */}
            <AnimatePresence>
                {mixIds.size > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6"
                    >
                        <div className="flex items-center gap-4 rounded-full border border-amber-500/40 bg-slate-900/95 px-5 py-3 shadow-2xl shadow-black/50 backdrop-blur">
                            <span className="text-sm text-slate-200">{mixIds.size}개 선택됨</span>
                            <button
                                type="button"
                                onClick={() => setMixIds(new Set())}
                                className="text-xs text-slate-400 transition-colors hover:text-slate-200"
                            >
                                초기화
                            </button>
                            <button
                                type="button"
                                disabled={mixIds.size < 2}
                                onClick={() => setShowMix(true)}
                                className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <FlaskRound className="h-3.5 w-3.5" />
                                믹스 결과 보기
                            </button>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Mix Result Modal */}
            <AnimatePresence>
                {showMix ? (
                    <motion.div
                        key="mix-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                        onClick={() => setShowMix(false)}
                    >
                        <motion.div
                            key="mix-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-800 shadow-2xl shadow-black/50"
                        >
                            <button
                                type="button"
                                onClick={() => setShowMix(false)}
                                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-500"
                                aria-label="닫기"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="flex flex-col items-center justify-center border-b border-slate-700/60 bg-slate-900/40 p-6 md:border-b-0 md:border-r">
                                    <div className="h-64 w-full sm:h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={mixChart} outerRadius="75%">
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                                                <Radar
                                                    name="Mixed Blend"
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

                                <div className="flex flex-col p-6 sm:p-8">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-500">
                                        Mixed Flavor DNA
                                    </p>
                                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-50 sm:text-3xl">
                                        {mixSelection.length}종 블렌드
                                    </h2>

                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {mixSelection.map((b) => (
                                            <span
                                                key={b.id}
                                                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300"
                                            >
                                                {b.nameEn}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="mt-5 text-sm leading-relaxed text-slate-400">
                                        선택한 원료들의 5축 향미 수치를 단순 평균한 참고용 시각화입니다. 실제 배합 비율·투입량·추출
                                        조건까지 반영한 정밀 예측은 아래 <b className="text-slate-300">AI Virtual Research Lab</b>에서
                                        확인하실 수 있습니다.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMix(false)
                                            setMixIds(new Set())
                                        }}
                                        className="mt-6 self-start rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-500"
                                    >
                                        선택 초기화하고 닫기
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

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
                                    <div className="flex items-start gap-4">
                                        <div
                                            ref={selectedThumbRef}
                                            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60"
                                        >
                                            {selectedThumbnail ? (
                                                // eslint-disable-next-line @next/next/no-img-element -- external Wikimedia URL
                                                <img src={selectedThumbnail} alt={selected.nameEn} className="h-full w-full object-cover" />
                                            ) : (
                                                <Leaf className="h-7 w-7 text-slate-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-500">
                                                Botanical Archive
                                            </p>
                                            <h2 className="mt-1 font-serif text-2xl font-semibold text-slate-50 sm:text-3xl">
                                                {selected.nameEn}
                                            </h2>
                                            <p className="text-sm italic text-slate-400">{selected.scientificName}</p>
                                            <p className="mt-1 text-xs text-slate-500">{selected.nameKo}</p>
                                        </div>
                                    </div>
                                    {selectedPageUrl ? (
                                        <a
                                            href={selectedPageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-flex w-fit items-center gap-1 text-xs text-amber-400 hover:underline"
                                        >
                                            Wikipedia에서 자세히 보기
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : null}

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
