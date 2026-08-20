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

function chart(citrus: number, spicy: number, floral: number, earthy: number, sweet: number): FlavorChartPoint[] {
    return [
        { subject: "Citrus", A: citrus, fullMark: 100 },
        { subject: "Spicy", A: spicy, fullMark: 100 },
        { subject: "Floral", A: floral, fullMark: 100 },
        { subject: "Earthy", A: earthy, fullMark: 100 },
        { subject: "Sweet", A: sweet, fullMark: 100 },
    ]
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
                    젠타로 증류소의 비밀 실험실에서 엄선한 보태니컬 원료 {botanicalData.length}종의 향미 구조와 추출 비법을
                    기록합니다. 동증류기를 거쳐온 각 원료의 풍미는 카드를 눌러 자세히 탐구하실 수 있습니다.
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
                        transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.05 }}
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
