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
    addBarrelEnhancement,
    applyBarrelFinishing,
    setBarrelEvaluationAdmin,
    fetchBarrelPricingConfig,
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
    Timer,
    Sparkles,
    Thermometer,
    Settings2,
    ArrowRight,
    Coffee,
    Star,
    Eye
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
        capacity: "5 Lít (khoảng 7 chai)",
        agingPeriod: "Khuyến nghị 6~12 tháng",
        recommendedSpirit: "ZENTARO Craft Rice Neutral Spirit Base",
        expRequirement: "Stake 50,000 ZTRO + trừ 1,000,000 EXP",
        ztroRequirementValue: 50000,
        expRequirementValue: 1000000,
        dimensions: "26cm x 18cm x 18cm",
        woodType: "American White Oak (Medium Toasting)",
        description: "Thùng nhỏ gọn dành cho Home Bar và hội viên gia đình nhỏ. Hương gỗ sồi thấm nhanh nên bạn có thể quan sát và hoàn thiện quá trình ủ hương thơm riêng biệt trong thời gian tương đối ngắn."
    },
    {
        size: "10L",
        label: "10L Oak Barrel",
        capacity: "10 Lít (khoảng 14 chai)",
        agingPeriod: "Khuyến nghị 12~18 tháng",
        recommendedSpirit: "ZENTARO Craft Rice Neutral Spirit Base",
        expRequirement: "Stake 100,000 ZTRO + trừ 2,000,000 EXP",
        ztroRequirementValue: 100000,
        expRequirementValue: 2000000,
        dimensions: "34cm x 24cm x 24cm",
        woodType: "Alligator Charred Honey Oak",
        description: "Quy cách gỗ sồi tiêu chuẩn được ưa chuộng nhất. Tannin và vanillin tự nhiên từ gỗ sồi hòa quyện cân đối giữa hương và vị, rất phù hợp để trưng bày trong phòng riêng hoặc bộ sưu tập nhỏ."
    },
    {
        size: "20L",
        label: "20L Oak Barrel",
        capacity: "20 Lít (khoảng 28 chai)",
        agingPeriod: "Khuyến nghị 18~24 tháng",
        recommendedSpirit: "ZENTARO Craft Rice Neutral Spirit Base",
        expRequirement: "Stake 200,000 ZTRO + trừ 4,000,000 EXP",
        ztroRequirementValue: 200000,
        expRequirementValue: 4000000,
        dimensions: "42cm x 30cm x 30cm",
        woodType: "European Limousin Oak (Heavy Toasting)",
        description: "Thùng ủ chuyên sâu dành cho người đam mê whisky/brandy thực thụ. Tỷ lệ diện tích bề mặt trên thể tích hợp lý giúp ủ lâu dài mà không thất thoát bay hơi quá mức, phát triển hương vị đa dạng."
    },
    {
        size: "40L",
        label: "40L Oak Barrel",
        capacity: "40 Lít (khoảng 56 chai)",
        agingPeriod: "Khuyến nghị 24~36 tháng trở lên",
        recommendedSpirit: "ZENTARO Craft Rice Neutral Spirit Base",
        expRequirement: "Stake 400,000 ZTRO + trừ 8,000,000 EXP",
        ztroRequirementValue: 400000,
        expRequirementValue: 8000000,
        dimensions: "52cm x 38cm x 38cm",
        woodType: "Ex-Bourbon White Oak Barrel",
        description: "Dung tích VVIP Reserve theo đuổi kiệt tác đỉnh cao. Được tối ưu cho quá trình ủ trung-dài hạn nhằm đạt sự cân bằng hoàn hảo nhất, được quản lý nghiêm ngặt tại khu vực ổn định nhất của Barrel Room ZenTaro."
    }
]

const BARREL_STORAGE_FEE_RATE = 0.15
const P2P_TRADE_FEE_RATE = 0.15

const FLAVORS = [
    { name: "Vanilla", desc: "Hương trắng ngọt ngào, mềm mại từ quá trình phân giải lignin của gỗ sồi tự nhiên" },
    { name: "Caramel", desc: "Vị ngọt sâu lắng hình thành từ quá trình caramel hóa đường trong thớ gỗ khi được đốt nóng" },
    { name: "Toffee", desc: "Hương bơ kết hợp giữa socola đen và caramel qua giai đoạn nướng (toasting)" },
    { name: "Cocoa", desc: "Hương cacao đen đắng nhẹ mà thơm bùi, thấm dần từ từ" },
    { name: "Chocolate", desc: "Nốt socola nhẹ nhàng với dư vị kéo dài, hoàn thiện qua quá trình char cháy mạnh" },
    { name: "Smoky", desc: "Hương khói quyến rũ từ nhựa gỗ khi đốt cháy trực tiếp bên trong thùng" },
    { name: "Spice", desc: "Nốt hương phức hợp, cay nồng gợi nhớ quế, hạt nhục đậu khấu đặc trưng của quá trình ủ" },
    { name: "Roasted Nut", desc: "Hương hạt rang thơm bùi từ cấu trúc hemicellulose được xử lý ở nhiệt độ cao" },
    { name: "Oak Aroma", desc: "Nốt gỗ cổ điển như đang đi giữa rừng, với nhựa cây tự nhiên đặc trưng của gỗ cao cấp" }
]

const BARREL_LITERS: Record<string, number> = { "5L": 5, "10L": 10, "20L": 20, "40L": 40 }

/** ZTRO staking requirement per liter to pay with EXP; not admin-configurable (only the EXP/ZP price is). */
const BARREL_STAKE_PER_LITER_ZTRO = 10000

// Mirrors backend BARREL_PREP_SECONDS — the barrel is being filled/prepped for the first 24h
// after order and isn't aging yet (no growth, no "aging" status) during that window.
const BARREL_PREP_SECONDS = 24 * 60 * 60

/** 0-500 taste score shown as a 5-star rating (proportional, rounded to the nearest star). */
function scoreToStarCount(score: number): number {
    return Math.max(0, Math.min(5, Math.round((score / 500) * 5)))
}

/** Blend master's 500-point score maps to a display grade tier. */
function scoreToGrade(score: number): string {
    if (score >= 480) return "💎 Diamond Barrel"
    if (score >= 460) return "🥇 Platinum Barrel"
    if (score >= 440) return "🟨 Gold Barrel"
    if (score >= 420) return "⚪ Silver Barrel"
    if (score >= 400) return "🟫 Bronze Barrel"
    if (score >= 380) return "Standard"
    return "Khuyến nghị ủ lại hoặc blend thêm"
}

// Static scoring rubric (500 points total) that the Blend Master's evaluation is based on.
const SCORING_RUBRIC: { category: string; maxPoints: number; items: { label: string; points: number }[] }[] = [
    {
        category: "A. Hương (Aroma) — 200 điểm",
        maxPoints: 200,
        items: [
            { label: "Cường độ hương gỗ sồi", points: 20 },
            { label: "Vanilla", points: 15 },
            { label: "Dừa", points: 10 },
            { label: "Toast", points: 10 },
            { label: "Caramel", points: 15 },
            { label: "Mật ong", points: 10 },
            { label: "Hạt", points: 10 },
            { label: "Spice", points: 15 },
            { label: "Hương trái cây", points: 15 },
            { label: "Hương hoa", points: 10 },
            { label: "Hương thảo mộc", points: 10 },
            { label: "Khói (Smoke)", points: 15 },
            { label: "Độ phức hợp của hương", points: 25 },
            { label: "Độ tinh khiết (không lẫn mùi lạ)", points: 20 },
        ],
    },
    {
        category: "B. Vị (Palate) — 180 điểm",
        maxPoints: 180,
        items: [
            { label: "Ấn tượng đầu", points: 20 },
            { label: "Vị ngọt", points: 20 },
            { label: "Độ chua", points: 10 },
            { label: "Vị đắng", points: 10 },
            { label: "Umami", points: 15 },
            { label: "Hương vị gỗ sồi", points: 20 },
            { label: "Vanilla", points: 10 },
            { label: "Caramel", points: 10 },
            { label: "Chocolate", points: 10 },
            { label: "Cà phê", points: 10 },
            { label: "Tiêu · Spice", points: 10 },
            { label: "Kết cấu (Mouthfeel)", points: 15 },
            { label: "Độ mềm mại", points: 20 },
        ],
    },
    {
        category: "C. Hậu vị (Finish) — 70 điểm",
        maxPoints: 70,
        items: [
            { label: "Độ dài dư vị", points: 20 },
            { label: "Dư hương", points: 15 },
            { label: "Độ lưu vị ngọt", points: 10 },
            { label: "Dư vị gỗ sồi", points: 10 },
            { label: "Độ cân bằng", points: 15 },
        ],
    },
    {
        category: "D. Chất lượng thùng gỗ sồi — 50 điểm",
        maxPoints: 50,
        items: [
            { label: "Tình trạng Char", points: 10 },
            { label: "Độ đều của toasting", points: 10 },
            { label: "Không rò rỉ", points: 10 },
            { label: "Duy trì hương gỗ sồi", points: 10 },
            { label: "Tình trạng thùng", points: 10 },
        ],
    },
]

// Barrel `status` values are written in Korean by the backend (used for equality checks
// elsewhere in this file) — this only maps them to a Vietnamese label for display.
const STATUS_LABEL_VI: Record<string, string> = {
    "ordered": "Chờ lưu kho",
    "위탁 숙성 중 (Room Aging)": "Đang ủ tại Barrel Room",
    "직접 배송 완료": "Đã giao tận nơi",
    "병입 완료 및 출고": "Đã đóng chai & xuất kho",
    "숙성 연장 중": "Đang gia hạn ủ",
    "각인 완료": "Đã khắc tên",
}
function statusLabelVi(status: string): string {
    return STATUS_LABEL_VI[status] ?? status
}

// Mirrors backend/src/token-exchange/barrel-options.ts — ids and prices must stay in sync.
const CHAR_LEVEL_LABEL: Record<string, string> = {
    char3: "Char #3 (mức đốt cháy mặc định)",
}

interface AgingEnvironmentOption {
    id: string
    label: string
    desc: string
}
const AGING_ENVIRONMENT_OPTIONS: AgingEnvironmentOption[] = [
    { id: "premium_room", label: "Premium Barrel Room", desc: "Phòng ủ riêng tư ổn định nhiệt độ 18~20°C" },
    { id: "music_432hz", label: "Music Aging 432Hz", desc: "Môi trường rung động & âm thanh cộng hưởng rừng 432Hz" },
]

interface EnhancementOption {
    id: string
    label: string
    tagline: string
    pricePerLiterZp: number
}
const AGING_ENHANCEMENT_OPTIONS: EnhancementOption[] = [
    { id: "vanilla_boost", label: "Vanilla Boost", tagline: "Đưa Oak Spiral (xoắn gỗ sồi) vào thùng", pricePerLiterZp: 10000 },
    { id: "deep_oak", label: "Deep Oak", tagline: "Đưa Oak Cube (khối gỗ sồi) vào thùng", pricePerLiterZp: 5000 },
    { id: "caramel_reserve", label: "Caramel Reserve", tagline: "Đưa thanh gỗ Medium Toast vào thùng", pricePerLiterZp: 10000 },
]

interface FinishingOptionSpec {
    id: string
    icon: string
    label: string
    pricePerLiterZp: number
    minDays: number
    maxDays: number
    effect: string
}
const FINISHING_OPTION_SPECS: FinishingOptionSpec[] = [
    { id: "coffee", icon: "☕", label: "Coffee Finish", pricePerLiterZp: 10000, minDays: 30, maxDays: 90, effect: "Hương espresso cà phê Đà Lạt, socola đen, hạt phỉ. Tăng độ đậm đà, dư vị kéo dài" },
    { id: "cacao", icon: "🍫", label: "Cacao Finish", pricePerLiterZp: 10000, minDays: 30, maxDays: 90, effect: "Hương socola đen, cacao, rang thơm. Vị ngọt mềm mại và hậu vị sang trọng" },
    { id: "vanilla", icon: "🌼", label: "Vanilla Finish", pricePerLiterZp: 10000, minDays: 30, maxDays: 60, effect: "Vanilla tự nhiên, kem, toffee với vị ngọt dịu. Hòa quyện cùng hương gỗ sồi" },
    { id: "cinnamon", icon: "🌿", label: "Cinnamon Finish", pricePerLiterZp: 10000, minDays: 15, maxDays: 45, effect: "Hương quế Việt Nam ấm áp đặc trưng, vị cay nhẹ, ngọt thanh dịu" },
    { id: "star_anise", icon: "⭐", label: "Star Anise Finish", pricePerLiterZp: 10000, minDays: 15, maxDays: 30, effect: "Hương cam thảo và thảo mộc, hậu vị sạch, cá tính phương Đông" },
]

export default function BarrelReservePage() {
    const [errorProfile, setErrorProfile] = useState<string | null>(null)

    // User Info & Balances
    const [expBalance, setExpBalance] = useState<number>(0)
    const [zpBalance, setZpBalance] = useState<number>(0)
    const [stakedZtro, setStakedZtro] = useState<number>(0)
    const [walletAddress, setWalletAddress] = useState<string>("")

    // Interactive Barrel Selection
    const [selectedSize, setSelectedSize] = useState<string>("10L")
    const [selectedAgingEnvironment, setSelectedAgingEnvironment] = useState<string>("premium_room")

    // My Barrels List
    const [barrels, setBarrels] = useState<BarrelDocument[]>([])
    const [actionBusy, setActionBusy] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    const [myUid, setMyUid] = useState<string>("")
    const [adminLevel, setAdminLevel] = useState<number | null>(null)
    const isAdmin = adminLevel !== null && adminLevel <= 2

    // Public Gallery (other members' barrels)
    const [publicBarrels, setPublicBarrels] = useState<PublicBarrel[]>([])
    const [galleryLoading, setGalleryLoading] = useState<boolean>(true)
    const [defaultGrowthRate, setDefaultGrowthRate] = useState<number>(0.25)
    // Admin-configurable initial subscription price per liter (defaults mirror backend DEFAULT_BARREL_PRICING).
    const [pricePerLiterExp, setPricePerLiterExp] = useState<number>(200000)
    const [pricePerLiterZp, setPricePerLiterZp] = useState<number>(200000)
    const currentSpecStatic = BARREL_SPECS.find(spec => spec.size === selectedSize) || BARREL_SPECS[1]
    const currentSpec = {
        ...currentSpecStatic,
        expRequirementValue: (BARREL_LITERS[currentSpecStatic.size] ?? 0) * pricePerLiterExp,
        ztroRequirementValue: (BARREL_LITERS[currentSpecStatic.size] ?? 0) * BARREL_STAKE_PER_LITER_ZTRO,
    }

    // Live ticking clock, used to compute cumulative aging duration client-side
    const [nowTick, setNowTick] = useState<number>(() => Math.floor(Date.now() / 1000))

    // Modals for Cert & QR Viewers
    const [activeCertBarrel, setActiveCertBarrel] = useState<BarrelDocument | null>(null)
    const [activeQrBarrel, setActiveQrBarrel] = useState<BarrelDocument | null>(null)

    // Custom Aging Options modal (enhancements + finishing) for a specific owned barrel
    const [activeOptionsBarrel, setActiveOptionsBarrel] = useState<BarrelDocument | null>(null)
    const [optionsBusy, setOptionsBusy] = useState<boolean>(false)
    const [optionsError, setOptionsError] = useState<string | null>(null)
    const [selectedFinishId, setSelectedFinishId] = useState<string>(FINISHING_OPTION_SPECS[0].id)
    const [finishDays, setFinishDays] = useState<number>(FINISHING_OPTION_SPECS[0].minDays)

    // Public gallery detail view: applied options + blend master evaluation (admin can edit inline)
    const [activeDetailBarrel, setActiveDetailBarrel] = useState<PublicBarrel | null>(null)
    const [evalScoreInput, setEvalScoreInput] = useState<number>(0)
    const [evalCommentInput, setEvalCommentInput] = useState<string>("")
    const [evalBusy, setEvalBusy] = useState<boolean>(false)
    const [evalError, setEvalError] = useState<string | null>(null)
    const [showRubric, setShowRubric] = useState<boolean>(false)
    // Optional detailed breakdown (Aroma/Palate/Finish/Barrel Quality). When used, total score
    // is auto-computed as their sum, and leaving the comment blank makes the backend AI-generate one.
    const [useEvalBreakdown, setUseEvalBreakdown] = useState<boolean>(false)
    const [evalAroma, setEvalAroma] = useState<number>(0)
    const [evalPalate, setEvalPalate] = useState<number>(0)
    const [evalFinish, setEvalFinish] = useState<number>(0)
    const [evalBarrelQuality, setEvalBarrelQuality] = useState<number>(0)

    const loadData = useCallback(async () => {
        try {
            const wallet = await fetchWallet()
            setExpBalance(wallet.exp)
            setZpBalance(wallet.ap)

            const dashboard = await fetchExchangeDashboard()
            setStakedZtro(dashboard.staked)
            setWalletAddress(dashboard.address)

            const myBarrelsList = await fetchMyBarrels()
            setBarrels(myBarrelsList)

            const me = await fetchMe()
            setMyUid(me.uid)
            setAdminLevel(me.adminLevel)
        } catch (err) {
            console.error("Failed to load user and barrel data:", err)
            const msg = err instanceof Error ? err.message : "Không thể tải thông tin hội viên."
            setErrorProfile(msg)
        }
    }, [])

    const loadPublicGallery = useCallback(async () => {
        setGalleryLoading(true)
        try {
            const [list, pricing] = await Promise.all([fetchPublicBarrels(), fetchBarrelPricingConfig()])
            setPublicBarrels(list)
            setDefaultGrowthRate(pricing.annualGrowthRate)
            setPricePerLiterExp(pricing.pricePerLiterExp)
            setPricePerLiterZp(pricing.pricePerLiterZp)
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
            return Math.max(0, endSec - startSec - BARREL_PREP_SECONDS)
        },
        [nowTick],
    )

    const handleOrderSubmit = async () => {
        const cost = currentSpec.expRequirementValue
        const ztroNeed = currentSpec.ztroRequirementValue
        const meetsStakeAndExp = stakedZtro >= ztroNeed && expBalance >= cost

        let confirmMessage: string
        if (meetsStakeAndExp) {
            confirmMessage = `Bạn có muốn đặt thùng ${currentSpec.label} không? ${cost.toLocaleString()} EXP sẽ bị trừ ngay khi đăng ký.`
        } else if (zpBalance >= cost) {
            confirmMessage = `Bạn chưa đủ điều kiện stake ZTRO hoặc số dư EXP. Bạn có muốn thanh toán ${cost.toLocaleString()} ZP để đặt thùng ${currentSpec.label} thay thế không?`
        } else {
            alert(`Bạn chưa đủ điều kiện đặt hàng.\n\n[Cách 1] Cần tối thiểu ${ztroNeed.toLocaleString()} ZTRO stake + ${cost.toLocaleString()} EXP (hiện có: ${stakedZtro.toLocaleString()} ZTRO, ${expBalance.toLocaleString()} EXP)\n[Cách 2] Thanh toán bằng ZP cần ${cost.toLocaleString()} ZP (hiện có: ${zpBalance.toLocaleString()} ZP)`)
            return
        }

        if (!confirm(confirmMessage)) {
            return
        }

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)

        try {
            const result = await submitBarrelOrder(selectedSize, selectedAgingEnvironment)
            const paidLabel = result.paymentMethod === "zp"
                ? `thanh toán thay thế ${result.paidAmount.toLocaleString()} ZP`
                : `trừ ${result.paidAmount.toLocaleString()} EXP`
            setActionSuccess(`Đặt hàng hoàn tất! Mã thùng riêng: ${result.barrelId} (${paidLabel}). Đã tự động tạo phiếu đặt chỗ và chứng nhận sở hữu.`)
            await loadData()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Xử lý đặt thùng thất bại.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleBarrelAction = async (barrelId: string, action: string, deliveryFee?: number) => {
        const confirmMessage =
            action === "deliver"
                ? `Bạn có muốn đăng ký giao hàng tận nhà không? Phí lưu kho Barrel Room ${(deliveryFee ?? 0).toLocaleString()} ZP (${(BARREL_STORAGE_FEE_RATE * 100).toFixed(0)}% giá trị hiện tại) sẽ bị trừ ngay, phí vận chuyển thực tế thanh toán khi nhận hàng.`
                : action === "bottle"
                ? "Bạn có muốn đăng ký đóng chai không? Lưu ý: sau khi đăng ký dịch vụ đóng chai, quyền sở hữu thùng gỗ (oak barrel) sẽ chuyển về ZENTARO — chỉ có rượu đã đóng chai được giao đến khách hàng, thùng gỗ không được giao kèm."
                : "Bạn có muốn đăng ký dịch vụ bổ sung này không?"
        if (!confirm(confirmMessage)) return

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)

        try {
            const result = await triggerBarrelAction(barrelId, action)
            setActionSuccess(`Đăng ký thành công! Trạng thái đã chuyển thành: ${result.nextStatus} (${result.nextSealStatus}).`)
            await loadData()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Xử lý thất bại.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleListForSale = async (barrelId: string, currentValueZp: number) => {
        if (!confirm(`Bạn có muốn đăng bán thùng này với giá thị trường hiện tại ${currentValueZp.toLocaleString()} ZP không? Giá được tự động tính theo dung tích và thời gian ủ, chủ sở hữu không thể tự đặt giá. Khi giao dịch thành công, ${(P2P_TRADE_FEE_RATE * 100).toFixed(0)}% giá trị bán sẽ bị trừ làm phí. Trong thời gian đăng bán, các yêu cầu giao hàng/đóng chai sẽ bị hạn chế.`)) return

        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await listBarrelForSale(barrelId)
            setActionSuccess("Đăng bán thành công.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Đăng bán thất bại.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleCancelSale = async (barrelId: string) => {
        if (!confirm("Bạn có muốn hủy đăng bán không?")) return
        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await cancelBarrelSale(barrelId)
            setActionSuccess("Đã hủy đăng bán.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Hủy đăng bán thất bại.")
        } finally {
            setActionBusy(false)
        }
    }

    const handleBuyBarrel = async (barrel: PublicBarrel) => {
        if (!confirm(`Bạn có muốn thanh toán ${barrel.currentValueZp.toLocaleString()} ZP để mua thùng này (${barrel.id}) không? Giá thị trường thời điểm mua sẽ là giá thanh toán cuối cùng.`)) return
        setActionBusy(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await buyBarrel(barrel.id)
            setActionSuccess("Mua thùng thành công. Hãy kiểm tra trong Bộ sưu tập thùng của tôi.")
            await Promise.all([loadData(), loadPublicGallery()])
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Mua thất bại.")
        } finally {
            setActionBusy(false)
        }
    }

    const openOptionsModal = (barrel: BarrelDocument) => {
        setOptionsError(null)
        setSelectedFinishId(FINISHING_OPTION_SPECS[0].id)
        setFinishDays(FINISHING_OPTION_SPECS[0].minDays)
        setActiveOptionsBarrel(barrel)
    }

    const handleAddEnhancement = async (enhancementId: string) => {
        if (!activeOptionsBarrel) return
        const option = AGING_ENHANCEMENT_OPTIONS.find((e) => e.id === enhancementId)
        if (!option) return
        const liters = BARREL_LITERS[activeOptionsBarrel.capacity] ?? 0
        const cost = liters * option.pricePerLiterZp
        if (!confirm(`Bạn có muốn thêm ${option.label} (${option.tagline}) không? ${cost.toLocaleString()} ZP (${liters}L × ${option.pricePerLiterZp.toLocaleString()} ZP/L) sẽ bị trừ ngay và cộng trực tiếp vào giá trị thùng.`)) return

        setOptionsBusy(true)
        setOptionsError(null)
        try {
            await addBarrelEnhancement(activeOptionsBarrel.id, enhancementId)
            setActionSuccess(`Đã thêm ${option.label}.`)
            await loadData()
            setActiveOptionsBarrel((prev) =>
                prev ? { ...prev, enhancements: [...(prev.enhancements ?? []), enhancementId] } : prev,
            )
        } catch (err) {
            setOptionsError(err instanceof Error ? err.message : "Thêm enhancement thất bại.")
        } finally {
            setOptionsBusy(false)
        }
    }

    const handleApplyFinishing = async () => {
        if (!activeOptionsBarrel) return
        const option = FINISHING_OPTION_SPECS.find((f) => f.id === selectedFinishId)
        if (!option) return
        const liters = BARREL_LITERS[activeOptionsBarrel.capacity] ?? 0
        const cost = liters * option.pricePerLiterZp
        if (!confirm(`Bạn có muốn đăng ký ${option.label} trong ${finishDays} ngày không? ${cost.toLocaleString()} ZP sẽ bị trừ ngay và cộng vào giá trị thùng; thời điểm áp dụng thực tế do Blend Master ZenTaro quyết định. (Chỉ đăng ký được 1 lần/thùng)`)) return

        setOptionsBusy(true)
        setOptionsError(null)
        try {
            await applyBarrelFinishing(activeOptionsBarrel.id, selectedFinishId, finishDays)
            setActionSuccess(`Đã tiếp nhận đăng ký ${option.label}. Blend Master ZenTaro sẽ tiến hành áp dụng thực tế.`)
            await loadData()
            setActiveOptionsBarrel((prev) =>
                prev ? { ...prev, finishing: { id: selectedFinishId, days: finishDays, requestedAt: new Date().toISOString(), startedAt: null } } : prev,
            )
        } catch (err) {
            setOptionsError(err instanceof Error ? err.message : "Đăng ký Finishing thất bại.")
        } finally {
            setOptionsBusy(false)
        }
    }

    const openDetailModal = (pb: PublicBarrel) => {
        setEvalError(null)
        setEvalScoreInput(pb.blendMasterScore ?? 0)
        setEvalCommentInput(pb.blendMasterComment ?? "")
        setUseEvalBreakdown(false)
        setEvalAroma(0)
        setEvalPalate(0)
        setEvalFinish(0)
        setEvalBarrelQuality(0)
        setShowRubric(false)
        setActiveDetailBarrel(pb)
    }

    const handleSaveEvaluation = async () => {
        if (!activeDetailBarrel) return
        setEvalBusy(true)
        setEvalError(null)
        try {
            const breakdown = useEvalBreakdown
                ? { aroma: evalAroma, palate: evalPalate, finish: evalFinish, barrelQuality: evalBarrelQuality }
                : undefined
            const result = await setBarrelEvaluationAdmin(activeDetailBarrel.id, evalScoreInput, evalCommentInput, breakdown)
            setEvalScoreInput(result.blendMasterScore)
            setEvalCommentInput(result.blendMasterComment ?? "")
            setActiveDetailBarrel((prev) =>
                prev
                    ? {
                          ...prev,
                          blendMasterScore: result.blendMasterScore,
                          blendMasterComment: result.blendMasterComment,
                          customAnnualGrowthRate: result.customAnnualGrowthRate,
                      }
                    : prev,
            )
            await loadPublicGallery()
        } catch (err) {
            setEvalError(err instanceof Error ? err.message : "평가 저장에 실패했습니다.")
        } finally {
            setEvalBusy(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHeader
                eyebrow="Dịch vụ"
                title="ZenTaro Barrel Reserve"
                description={<>Chương trình thùng gỗ cao cấp dành riêng cho hội viên <span className="notranslate">EXP</span> — trải nghiệm đặc biệt cho những ai sở hữu thời gian</>}
            />

            <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">

                {/* User Gating or Balance Summary Bar */}
                {errorProfile === "로그인이 필요합니다." ? (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm text-yellow-600/90 text-center">
                        Vui lòng đăng nhập trước để xem thông tin và đăng ký dịch vụ dành riêng cho hạng thành viên này.{" "}
                        <Link href="/my/profile" className="text-amber-500 underline underline-offset-4 font-bold ml-2">
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm">
                        <div>
                            <span className="text-xs text-muted-foreground block">Tổng số ZTRO đã stake</span>
                            <span className="text-base font-bold text-foreground mt-1 block">
                                {stakedZtro.toLocaleString()} ZTRO
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">Số dư <span className="notranslate">EXP</span> khả dụng</span>
                            <span className="text-base font-bold text-amber-500 mt-1 block">
                                {expBalance.toLocaleString()} <span className="notranslate">EXP</span>
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">Số dư ZP khả dụng</span>
                            <span className="text-base font-bold text-emerald-500 mt-1 block">
                                {zpBalance.toLocaleString()} ZP
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
                        Hương vị nguyên bản tuyệt đỉnh được thời gian chưng cất
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        ZenTaro Barrel Reserve không đơn thuần là chương trình mua rượu.
                        Hội viên sẽ đưa nguyên liệu rượu nền cao cấp do chính ZenTaro Distillery chưng cất vào thùng gỗ sồi cao cấp được tuyển chọn kỹ lưỡng,
                        tự tay thiết kế và sở hữu giá trị vô hạn được bồi đắp theo thời gian trong môi trường ủ riêng tư.
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
                            Chọn thùng gỗ sồi cao cấp (Premium Oak Barrel)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hãy đăng ký dung tích thùng phù hợp nhất theo điều kiện của bạn và tạo nên danh mục ủ rượu cao cấp của riêng mình.
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
                                        Bao gồm thông tin chất liệu gỗ sồi
                                    </span>
                                </div>

                                <h4 className="font-display text-2xl font-semibold text-foreground">
                                    Thông số chi tiết {currentSpec.label}
                                </h4>

                                <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                                    {currentSpec.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">Tổng dung tích lưu trữ</span>
                                        <span className="text-sm font-semibold font-mono text-foreground">{currentSpec.capacity}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">Thời gian ủ khuyến nghị</span>
                                        <span className="text-sm font-semibold text-foreground">{currentSpec.agingPeriod}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">Rượu nền khuyến nghị</span>
                                        <span className="text-sm font-semibold text-amber-500">{currentSpec.recommendedSpirit}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-muted-foreground block">Quy cách & xuất xứ gỗ sồi</span>
                                        <span className="text-sm font-semibold text-foreground">{currentSpec.woodType}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border/40 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono text-[10px]">
                                            <Sparkles className="w-3 h-3 mr-1" /> Char #3 ⭐ Mặc định
                                        </Badge>
                                        <span className="text-[11px] text-muted-foreground">Mức đốt cháy cơ bản áp dụng chung cho tất cả các thùng.</span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground block flex items-center gap-1">
                                        <Thermometer className="w-3 h-3" /> Chọn môi trường ủ (Aging Environment)
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {AGING_ENVIRONMENT_OPTIONS.map((env) => (
                                            <button
                                                key={env.id}
                                                type="button"
                                                onClick={() => setSelectedAgingEnvironment(env.id)}
                                                className={`text-left p-3 rounded-lg border text-xs transition-all ${selectedAgingEnvironment === env.id
                                                    ? "border-amber-500 bg-amber-500/5"
                                                    : "border-border/60 bg-card hover:border-amber-500/30"
                                                    }`}
                                            >
                                                <span className="font-semibold text-foreground block">{env.label}</span>
                                                <span className="text-[10px] text-muted-foreground">{env.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background/80 rounded-lg p-5 border border-border/40 flex flex-col justify-between space-y-4">
                                <div>
                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                                        Order Requirements
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        Giá thùng là <span className="notranslate">{pricePerLiterExp.toLocaleString()} EXP</span> hoặc <span className="notranslate">{pricePerLiterZp.toLocaleString()} ZP</span> mỗi lít.
                                        Để thanh toán bằng <span className="notranslate">EXP</span>, bạn cần stake tối thiểu {BARREL_STAKE_PER_LITER_ZTRO.toLocaleString()} ZTRO mỗi lít; thanh toán bằng ZP không yêu cầu stake và có thể đặt hàng ngay với cùng số tiền.
                                    </p>
                                </div>
                                <div className="bg-card p-3 rounded border border-amber-500/10 text-xs space-y-1">
                                    <span className="text-muted-foreground block">Stake cần thiết khi thanh toán EXP:</span>
                                    <span className="text-foreground font-semibold block">
                                        Từ {currentSpec.ztroRequirementValue.toLocaleString()} ZTRO
                                    </span>
                                    <span className="text-muted-foreground block mt-1">Chi phí (thanh toán EXP):</span>
                                    <span className="text-amber-500 font-bold block">
                                        Trừ ngay {currentSpec.expRequirementValue.toLocaleString()} <span className="notranslate">EXP</span>
                                    </span>
                                    <span className="text-muted-foreground block mt-1">Hoặc thanh toán ZP (không cần stake):</span>
                                    <span className="text-emerald-500 font-bold block">
                                        Trừ ngay {currentSpec.expRequirementValue.toLocaleString()} ZP
                                    </span>
                                </div>
                                <Button
                                    onClick={handleOrderSubmit}
                                    disabled={actionBusy || errorProfile === "로그인이 필요합니다."}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs py-2 shadow"
                                >
                                    {actionBusy ? "Đang xử lý..." : `Đăng ký thùng ${currentSpec.size}`}
                                </Button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Custom Aging Options — informational overview of the 3 option categories */}
                <section className="space-y-6">
                    <div className="border-b border-border/60 pb-3">
                        <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                            <Settings2 className="w-5 h-5 text-amber-500" />
                            Custom Aging Options — Tùy chọn ủ tùy chỉnh
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            3 bước tùy chỉnh để tạo nên thùng rượu đậm chất ZenTaro nhất. Áp dụng thực tế tại mục Quản lý tùy chọn thùng trong &quot;Bộ sưu tập thùng của tôi&quot; bên dưới.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* ① Creation Options */}
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono text-[10px]">① Chọn khi tạo thùng</Badge>
                            <h4 className="font-display font-semibold text-sm text-foreground">Barrel Creation Options</h4>
                            <p className="text-[11px] text-muted-foreground">Các tùy chọn được chọn khi tạo thùng gỗ sồi.</p>
                            <div className="space-y-2 pt-1">
                                <div className="text-xs bg-background/60 rounded-lg p-2.5 border border-border/40">
                                    <span className="font-semibold text-foreground">Char Level</span>
                                    <span className="ml-1 text-amber-500">Char #3 ⭐ Mặc định</span>
                                </div>
                                <div className="text-xs bg-background/60 rounded-lg p-2.5 border border-border/40">
                                    <span className="font-semibold text-foreground block mb-1">Aging Environment</span>
                                    {AGING_ENVIRONMENT_OPTIONS.map((env) => (
                                        <p key={env.id} className="text-muted-foreground">· {env.label} ({env.desc})</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ② Aging Enhancement */}
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono text-[10px]">② Thêm trong lúc ủ</Badge>
                            <h4 className="font-display font-semibold text-sm text-foreground">Aging Enhancement</h4>
                            <p className="text-[11px] text-muted-foreground">Dịch vụ tăng cường hương vị, có thể thêm bất cứ lúc nào trong quá trình ủ.</p>
                            <div className="space-y-1.5 pt-1">
                                {AGING_ENHANCEMENT_OPTIONS.map((opt) => (
                                    <div key={opt.id} className="flex items-center justify-between text-xs bg-background/60 rounded-lg p-2.5 border border-border/40">
                                        <div>
                                            <span className="font-semibold text-foreground block">{opt.label}</span>
                                            <span className="text-[10px] text-muted-foreground">{opt.tagline}</span>
                                        </div>
                                        <span className="text-amber-500 font-bold whitespace-nowrap">{opt.pricePerLiterZp.toLocaleString()} ZP/L</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ③ Finishing */}
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono text-[10px]">③ Ủ đặc biệt trước khi đóng chai</Badge>
                            <h4 className="font-display font-semibold text-sm text-foreground">Tùy chọn Finishing</h4>
                            <p className="text-[11px] text-muted-foreground">Ủ đặc biệt trong 2~8 tuần trước khi đóng chai (1 lần/thùng, tính giá theo lít). Blend Master của ZenTaro sẽ quyết định thời điểm áp dụng thực tế sau khi đăng ký.</p>
                            <div className="space-y-1.5 pt-1">
                                {FINISHING_OPTION_SPECS.map((f) => (
                                    <div key={f.id} className="text-xs bg-background/60 rounded-lg p-2.5 border border-border/40">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">{f.icon} {f.label}</span>
                                            <span className="text-amber-500 font-bold whitespace-nowrap">{f.pricePerLiterZp.toLocaleString()} ZP/L</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.minDays}~{f.maxDays}일 · {f.effect}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* How the flavor stick is made — illustrative process flow */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                        <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-amber-500" /> Thanh gỗ hương vị được làm như thế nào (ví dụ: Coffee Finish)
                        </h4>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                            {["Thanh gỗ sồi", "Ngâm trong nước cốt cà phê Đà Lạt", "Phơi khô", "Rang (Toasting)", "Đưa vào thùng gỗ sồi"].map((step, idx, arr) => (
                                <div key={step} className="flex items-center gap-2">
                                    <span className="rounded-full border border-amber-500/30 bg-card px-3 py-1.5 font-medium text-foreground whitespace-nowrap">
                                        {step}
                                    </span>
                                    {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-amber-500/60 flex-shrink-0" />}
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                            Nhờ đó hương cà phê thấm vào rất nhẹ nhàng, tinh tế. Các tùy chọn Finishing khác (Cacao, Vanilla, Cinnamon, Star Anise) cũng được hoàn thiện theo cách tương tự, ngâm thanh gỗ sồi trong nước cốt của từng nguyên liệu.
                            Chứng nhận số sẽ hiển thị các tùy chọn đã áp dụng dưới dạng huy hiệu, và số tiền thanh toán cho tùy chọn sẽ được cộng trực tiếp vào tổng giá trị của thùng.
                        </p>
                    </div>
                </section>

                {/* My Barrel Collection Section */}
                {errorProfile !== "로그인이 필요합니다." && (
                    <section className="space-y-6">
                        <div className="border-b border-border/60 pb-3">
                            <h3 className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Award className="w-5 h-5 text-amber-500" />
                                Bộ sưu tập thùng của tôi (My Barrel Collection)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Danh sách thùng gỗ sồi riêng tư mà bạn đang sở hữu. Hãy xem chứng nhận và thực hiện các dịch vụ nhập/xuất kho ngay tại đây.
                            </p>
                        </div>

                        {barrels.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                Bạn chưa sở hữu thùng nào. Hãy đăng ký thùng đầu tiên theo điều kiện ở trên!
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
                                    const deliveryFee = Math.round(barrel.currentValueZp * BARREL_STORAGE_FEE_RATE)

                                    return (
                                        <div
                                            key={barrel.id}
                                            className="rounded-xl border border-border/60 bg-card p-5 space-y-4 hover:border-amber-500/30 transition-all duration-300"
                                        >
                                            <div className="flex flex-wrap justify-between items-start gap-3">
                                                <div className="flex gap-3 min-w-0">
                                                    <BarrelVisual
                                                        capacity={barrel.capacity}
                                                        progress={progress}
                                                        isAging={isAging}
                                                        isDone={isDone}
                                                    />
                                                    <div className="min-w-0">
                                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-mono text-[10px]">
                                                            {barrel.id}
                                                        </Badge>
                                                        <h4 className="font-display font-bold text-base text-foreground mt-1 break-words">
                                                            {barrel.capacity} Premium Oak ({spec?.woodType.split(" (")[0] || ""})
                                                        </h4>
                                                        {barrel.forSale && (
                                                            <Badge className="mt-1.5 bg-emerald-500 text-black border-none text-[10px] uppercase font-bold flex items-center gap-1 w-fit">
                                                                <Tag className="w-3 h-3" />
                                                                Đang bán · {barrel.currentValueZp.toLocaleString()} ZP
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-amber-500 text-black border-none text-[10px] uppercase font-bold whitespace-nowrap shrink-0">
                                                    {barrel.status === "ordered" ? "Chờ lưu kho (Ordered)" : statusLabelVi(barrel.status)}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border/40 py-3 my-2">
                                                <div>
                                                    <span className="text-muted-foreground block">Tình trạng niêm phong</span>
                                                    <span className="font-semibold text-emerald-500">{barrel.sealStatus}</span>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Timer className="w-3 h-3" /> Thời gian ủ tích lũy {isAging && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                    </span>
                                                    <span className="font-mono font-semibold text-foreground text-[11px]">
                                                        {formatAgingDuration(agingSeconds)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Số chứng nhận số</span>
                                                    <span className="font-mono text-foreground">{barrel.certNumber}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Ngày bắt đầu</span>
                                                    <span className="font-mono text-foreground">
                                                        {barrel.productionDate ? new Date(barrel.productionDate._seconds * 1000).toLocaleDateString() : "-"}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <span className="text-muted-foreground block">Giá thị trường hiện tại (tự động tính)</span>
                                                    <span className="font-mono font-bold text-amber-500">
                                                        {barrel.currentValueZp.toLocaleString()} ZP
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500">
                                                    {CHAR_LEVEL_LABEL[barrel.charLevel ?? "char3"] ?? barrel.charLevel}
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] border-border/60 text-muted-foreground">
                                                    {AGING_ENVIRONMENT_OPTIONS.find((e) => e.id === barrel.agingEnvironment)?.label ?? "Premium Barrel Room"}
                                                </Badge>
                                                {(barrel.enhancements ?? []).map((eid) => (
                                                    <Badge key={eid} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">
                                                        {AGING_ENHANCEMENT_OPTIONS.find((e) => e.id === eid)?.label ?? eid}
                                                    </Badge>
                                                ))}
                                                {barrel.finishing && (
                                                    <Badge variant="outline" className="text-[9px] border-pink-500/30 text-pink-400">
                                                        {FINISHING_OPTION_SPECS.find((f) => f.id === barrel.finishing?.id)?.icon}{" "}
                                                        {FINISHING_OPTION_SPECS.find((f) => f.id === barrel.finishing?.id)?.label ?? barrel.finishing.id}
                                                        {" "}{barrel.finishing.startedAt ? "đang áp dụng" : "đang chờ"}
                                                    </Badge>
                                                )}
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
                                                    Chứng nhận số
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 text-[11px] h-8 bg-zinc-900 border-border/60 text-zinc-300 hover:text-white"
                                                    onClick={() => setActiveQrBarrel(barrel)}
                                                >
                                                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                                                    Thông tin QR thời gian thực
                                                </Button>
                                                {!isDone && !barrel.forSale && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1 text-[11px] h-8 border-amber-500/40 text-amber-500 hover:text-amber-400"
                                                        onClick={() => openOptionsModal(barrel)}
                                                    >
                                                        <Settings2 className="w-3.5 h-3.5" />
                                                        Quản lý tùy chọn thùng
                                                    </Button>
                                                )}

                                                {!barrel.forSale && barrel.status === "ordered" && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "deliver", deliveryFee)}
                                                        >
                                                            Đăng ký giao tận nơi (phí lưu kho {deliveryFee.toLocaleString()} ZP)
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
                                                            Đăng ký đóng chai
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-[11px] h-8 border-border/60 text-zinc-300"
                                                            onClick={() => handleBarrelAction(barrel.id, "extend_aging")}
                                                        >
                                                            Gia hạn ủ
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[11px] h-8 font-semibold"
                                                            onClick={() => handleBarrelAction(barrel.id, "deliver", deliveryFee)}
                                                        >
                                                            Đăng ký giao tận nơi (phí lưu kho {deliveryFee.toLocaleString()} ZP)
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
                                                            Hủy đăng bán
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
                                                            Đăng bán theo giá thị trường
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
                                Bộ sưu tập thùng toàn hội viên (Public Collection)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Cùng khám phá các thùng rượu của toàn thể hội viên ZenTaro. Thùng đang đăng bán có thể mua ngay bằng ZP.
                            </p>
                        </div>

                        {galleryLoading ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                Đang tải...
                            </div>
                        ) : publicBarrels.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                                Chưa có thùng nào được đăng ký.
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
                                                        {pb.ownerLabel} {isMine && <span className="text-amber-500">(Tôi)</span>}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        Đang ủ {formatAgingDuration(agingSeconds)}
                                                    </p>
                                                    <Badge className="mt-1 bg-amber-500/90 text-black border-none text-[9px] font-bold">
                                                        {pb.status === "ordered" ? "Chờ lưu kho" : statusLabelVi(pb.status)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-center text-muted-foreground">
                                                Giá thị trường <span className="font-mono font-bold text-amber-500">{pb.currentValueZp.toLocaleString()} ZP</span>
                                            </div>

                                            {typeof pb.blendMasterScore === "number" ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex items-center gap-0.5">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3 h-3 ${i < scoreToStarCount(pb.blendMasterScore ?? 0) ? "fill-amber-500 text-amber-500" : "text-zinc-700"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {(1 + (pb.customAnnualGrowthRate ?? defaultGrowthRate)).toFixed(2)}x
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-amber-500/90 font-semibold">
                                                        {scoreToGrade(pb.blendMasterScore)}
                                                    </span>
                                                </div>
                                            ) : null}

                                            <div className="flex flex-wrap justify-center gap-1">
                                                <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-500">
                                                    {CHAR_LEVEL_LABEL[pb.charLevel ?? "char3"] ?? pb.charLevel}
                                                </Badge>
                                                <Badge variant="outline" className="text-[8px] border-border/60 text-muted-foreground">
                                                    {AGING_ENVIRONMENT_OPTIONS.find((e) => e.id === pb.agingEnvironment)?.label ?? "Premium Barrel Room"}
                                                </Badge>
                                                {(pb.enhancements ?? []).map((eid) => (
                                                    <Badge key={eid} variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-500">
                                                        {AGING_ENHANCEMENT_OPTIONS.find((e) => e.id === eid)?.label ?? eid}
                                                    </Badge>
                                                ))}
                                                {pb.finishing && (
                                                    <Badge variant="outline" className="text-[8px] border-pink-500/30 text-pink-400">
                                                        {FINISHING_OPTION_SPECS.find((f) => f.id === pb.finishing?.id)?.icon}{" "}
                                                        {FINISHING_OPTION_SPECS.find((f) => f.id === pb.finishing?.id)?.label ?? pb.finishing.id}
                                                    </Badge>
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-[11px] h-8 border-border/60 flex items-center justify-center gap-1"
                                                onClick={() => openDetailModal(pb)}
                                            >
                                                <Eye className="w-3.5 h-3.5 text-amber-500" />
                                                Xem chi tiết tùy chọn · đánh giá Blend Master
                                            </Button>

                                            {pb.forSale ? (
                                                isMine ? (
                                                    <div className="text-[10px] text-emerald-400 border border-emerald-500/20 rounded px-2 py-1.5 text-center">
                                                        Thùng của tôi · Đang bán
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
                                                        Mua ngay
                                                    </Button>
                                                )
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground text-center py-1.5">
                                                    Không bán
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
                            Quy trình đặt thùng (Order Process)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hãy xem quy trình chưng cất bài bản từ giai đoạn ủ đến lưu giữ chứng nhận.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 1 & 2</div>
                            <h4 className="font-semibold text-sm text-foreground">Chọn thông số thùng và xét duyệt điều kiện sở hữu</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Khi hội viên chọn dung tích thùng mong muốn, hệ thống sẽ tra cứu và xác minh theo thời gian thực lượng ZTRO đã stake cùng số dư <span className="notranslate">EXP</span> trong ví.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 3 & 4</div>
                            <h4 className="font-semibold text-sm text-foreground">Duyệt đơn hàng và nạp rượu nền</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Khi xác minh điều kiện thành công, <span className="notranslate">EXP</span> off-chain sẽ tự động bị trừ, và ZenTaro Distillery sẽ thiết lập quy trình rót rượu nền vào thùng gỗ sồi thủ công.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border/40 space-y-2">
                            <div className="text-amber-500 font-mono font-bold text-xs">STEP 5 & 6</div>
                            <h4 className="font-semibold text-sm text-foreground">Niêm phong chính thức và cấp chứng nhận số</h4>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Gắn niêm phong Timestamp Seal an toàn và ánh xạ mã QR riêng biệt, bắt đầu cấp chứng nhận sở hữu và quản lý vòng đời cho hội viên.
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
                            Xử lý đa chiều loại gỗ sồi và mức đốt cháy (char) để hoàn thiện nốt hương signature sâu lắng, tinh tế tự nhiên.
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
                        &ldquo; ZenTaro không chỉ là thùng gỗ đựng rượu, mà là thùng gỗ được thiết kế để kiến tạo hương vị. &rdquo;
                    </div>
                </section>

                {/* Timestamp Seal Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-5">
                        <h3 className="font-display text-xl font-bold flex items-center gap-2 text-foreground">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Timestamp Seal & Tem thuế
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Ngay khi rót rượu nền tại ZenTaro Distillery, thuế rượu nền được nộp đầy đủ theo quy định và
                            <strong> tem thuế (tax stamp)</strong> hợp lệ được dán lên thùng, sau đó gắn thêm <strong>thẻ Timestamp Seal</strong> ghi nhận thời điểm. Nhờ vậy, thùng gỗ sồi có thể được tái sử dụng cho chu kỳ ủ tiếp theo sau khi hoàn tất.
                        </p>
                        <div className="space-y-3">
                            <div className="flex gap-3 text-xs">
                                <span className="font-mono font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded h-fit">
                                    Thông tin ghi nhận
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Mã số thùng riêng · Số tem thuế rượu nền · Ngày rót đầu tiên · Ngày bắt đầu ủ · Thông tin off-chain của chủ sở hữu · Mã QR xác thực số riêng biệt
                                </p>
                            </div>
                            <div className="flex gap-3 text-xs">
                                <span className="font-mono font-bold text-red-500 bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded h-fit">
                                    Điều kiện hợp lệ
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Lịch sử ủ chính thức chỉ được công nhận khi tem thuế và thẻ Timestamp Seal còn hợp lệ, đầy đủ theo đúng quy định thuế rượu.
                                </p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/60 p-4 rounded-xl space-y-3">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                                Môi trường quản lý ZenTaro Barrel Room
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Rượu được ủ an toàn tại Barrel Room trực thuộc ZenTaro Distillery, vận hành hệ thống ổn định nhiệt độ/độ ẩm tối ưu quanh năm (15~18°C, độ ẩm 60~70%).
                                Bạn có thể theo dõi từ xa số năm ủ và biến động nhiệt độ bất cứ lúc nào qua chứng nhận số.
                            </p>
                        </div>
                    </div>

                    {/* Timestamp Seal graphic mockup */}
                    <div className="border border-border/60 bg-card rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="font-display font-semibold text-base text-foreground">Cấu trúc tem thuế & Timestamp Seal chính thức</h4>
                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                            Khi hoàn tất đặt thùng, chứng nhận tem thuế và Timestamp Seal được tự động đăng ký vào cơ sở dữ liệu ánh xạ block, và việc quét QR sẽ xác minh theo thời gian thực tính hợp lệ của tem thuế in trên thùng gỗ sồi thực tế.
                        </p>
                        <div className="w-full bg-background border border-border/60 p-3 rounded-lg flex items-center justify-between text-left text-[10px]">
                            <div>
                                <span className="text-muted-foreground block">Trạng thái tem thuế :</span>
                                <span className="text-emerald-500 font-bold">SECURED (Hợp lệ)</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-right">Chuỗi đăng ký bảo chứng :</span>
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
                            Các tính năng cốt lõi dành riêng cho hội viên Barrel Club khi đăng ký thùng gỗ sồi chỉ định.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <MapPin className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ① Ủ ký gửi tại Barrel Room
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Lưu trữ dài hạn an toàn tại phòng ủ chính thức được thiết kế nghiêm ngặt về nhiệt độ, độ ẩm và độ rung, không cần bạn tự quản lý.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <History className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ② Chuyển nhượng & bán quyền sở hữu
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Dễ dàng chuyển nhượng/bán thùng đang sở hữu cho hội viên ZenTaro khác ngay trên điện thoại, mọi giao dịch đều được ghi nhận vĩnh viễn.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between min-h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <Truck className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ③ Dịch vụ giao hàng tận nơi
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Giao trọn thùng còn nguyên niêm phong đến tận nhà/cửa hàng của chủ sở hữu bất cứ khi nào bạn muốn, đảm bảo tính nguyên bản.
                                    Phí lưu kho ({(BARREL_STORAGE_FEE_RATE * 100).toFixed(0)}% giá trị hiện tại) bị trừ bằng ZP khi đăng ký, phí vận chuyển thực tế thanh toán riêng khi nhận hàng.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3 flex flex-col justify-between h-48">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                    <FileText className="w-4 h-4 text-amber-500" />
                                </div>
                                <h4 className="font-display font-medium text-sm text-foreground">
                                    ④ Đóng chai (Bottling) & Nhãn
                                </h4>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Khi đăng ký đóng chai rượu đã ủ xong, chúng tôi hỗ trợ lọc nến, đóng chai dung tích lớn và dán nhãn ấn sở hữu cao cấp.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Aging & Quality Assessment Guide */}
                <section className="space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 px-3 py-1 bg-amber-500/5 font-mono">
                            AGING &amp; QUALITY ASSESSMENT
                        </Badge>
                        <h3 className="font-display text-2xl font-bold text-foreground">
                            Hướng dẫn ủ và đánh giá chất lượng thùng gỗ sồi Zentaro
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Ủ trong thùng gỗ sồi không phải là câu chuyện về thời gian, mà là <span className="text-foreground font-semibold">quá trình tìm ra sự cân bằng tối ưu</span>.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <p>
                            Master Blender của Zentaro định kỳ lấy <span className="text-foreground font-semibold">mẫu 20mL</span>
                            trong suốt quá trình ủ để đánh giá tổng thể về hương, vị, màu sắc, độ đậm đà và sự cân bằng của gỗ sồi. Mọi kết quả đánh giá đều được ghi lại, và giá trị cũng như hạng của thùng sẽ được quyết định dựa trên điểm số.
                        </p>
                        <p>
                            Đặc biệt, thùng nhỏ sẽ ủ nhanh hơn nhiều so với thùng lớn. Vì vậy nếu ủ quá lâu, hương gỗ sồi và tannin có thể bị chiết xuất quá mức
                            khiến mất cân bằng hương vị nguyên bản. Zentaro luôn tìm ra thời điểm ủ lý tưởng nhất để mang đến whisky ở trạng thái tốt nhất cho chủ sở hữu thùng.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            Lịch thử rượu của Master Blender
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-border/60 bg-card">
                                <span className="text-xs font-mono text-amber-500">2 tuần sau khi bắt đầu ủ</span>
                                <p className="mt-1 text-sm text-foreground">Lần thử đầu tiên và đánh giá ủ ban đầu</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border/60 bg-card">
                                <span className="text-xs font-mono text-amber-500">Ủ 1~3 tháng</span>
                                <p className="mt-1 text-sm text-foreground">Thử định kỳ mỗi 7 ngày</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border/60 bg-card">
                                <span className="text-xs font-mono text-amber-500">Ủ 3~6 tháng</span>
                                <p className="mt-1 text-sm text-foreground">Thử định kỳ mỗi 2 tuần tùy tình trạng ủ</p>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            Hạng mục đánh giá chất lượng
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "Màu sắc (Color)",
                                "Hương (Aroma)",
                                "Độ đậm đà (Body)",
                                "Vị ngọt (Sweetness)",
                                "Cân bằng gỗ sồi (Oak Balance)",
                                "Tannin",
                                "Hậu vị (Finish)",
                                "Cân bằng tổng thể (Overall Balance)",
                            ].map((item) => (
                                <Badge key={item} variant="outline" className="border-amber-500/30 text-foreground/90 px-3 py-1.5 text-xs">
                                    {item}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Mỗi kết quả thử rượu đều được ghi lại trong hệ thống quản lý ủ rượu của Zentaro, liên tục theo dõi tiến trình ủ.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-3">
                        <h4 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-500" />
                            Đóng chai và giao hàng
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Việc đóng chai được tiến hành ngay khi Master Blender xác định thùng đã đạt <span className="text-foreground font-semibold">trạng thái ủ lý tưởng nhất</span>.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Sau khi đóng chai, chủ sở hữu thùng sẽ nhận được báo cáo kết quả ủ và đánh giá chất lượng, cùng với việc giao hàng ở trạng thái tốt nhất.
                        </p>
                    </div>

                    <blockquote className="max-w-2xl mx-auto text-center border-l-2 border-amber-500/60 pl-5 py-2">
                        <p className="font-display text-base sm:text-lg text-foreground italic">
                            &ldquo;Whisky tốt nhất không phải là whisky được ủ lâu nhất, mà là whisky được đóng chai đúng vào khoảnh khắc hoàn hảo nhất.&rdquo;
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">— Zentaro Master Blender</p>
                    </blockquote>
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
                            Ủ rượu là một hành trình dài. Trong mỗi thùng gỗ sồi không chỉ đơn thuần chứa cồn được chưng cất tinh xảo,
                            mà còn lưu giữ trọn vẹn hương gỗ sồi được thời gian tạo nên cùng câu chuyện của chính chúng ta.
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
                            Đóng [✕]
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
                                <span className="text-white">{activeCertBarrel.capacity} (Thùng Reserve)</span>
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
                                <span className="text-emerald-500 font-bold block animate-pulse">{statusLabelVi(activeCertBarrel.status)}</span>
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
                                Custom Aging Options
                            </span>
                            <div className="flex flex-wrap gap-1.5 font-sans">
                                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500">
                                    {CHAR_LEVEL_LABEL[activeCertBarrel.charLevel ?? "char3"] ?? activeCertBarrel.charLevel}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] border-zinc-600 text-zinc-300">
                                    {AGING_ENVIRONMENT_OPTIONS.find((e) => e.id === activeCertBarrel.agingEnvironment)?.label ?? "Premium Barrel Room"}
                                </Badge>
                                {(activeCertBarrel.enhancements ?? []).map((eid) => (
                                    <Badge key={eid} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">
                                        {AGING_ENHANCEMENT_OPTIONS.find((e) => e.id === eid)?.label ?? eid}
                                    </Badge>
                                ))}
                                {activeCertBarrel.finishing && (
                                    <Badge variant="outline" className="text-[9px] border-pink-500/30 text-pink-400">
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeCertBarrel.finishing?.id)?.icon}{" "}
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeCertBarrel.finishing?.id)?.label ?? activeCertBarrel.finishing.id}
                                        {" "}({activeCertBarrel.finishing.days} ngày, {activeCertBarrel.finishing.startedAt ? "đang áp dụng" : "đang chờ"})
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-amber-500/20 pt-4 mt-4 space-y-2">
                            <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                                Nhật ký Ownership History
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
                                Đã cấp mã QR xác thực: {activeCertBarrel.qrKey}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Aging Options Modal — enhancements + finishing for one owned barrel */}
            {activeOptionsBarrel && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-border/40 pb-3">
                            <div>
                                <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-1.5">
                                    <Settings2 className="w-4.5 h-4.5 text-amber-500" />
                                    Quản lý tùy chọn thùng
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{activeOptionsBarrel.id}</p>
                            </div>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground text-sm"
                                onClick={() => setActiveOptionsBarrel(null)}
                            >
                                Đóng [✕]
                            </button>
                        </div>

                        {optionsError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                {optionsError}
                            </div>
                        )}

                        {/* Flavor Upgrade (Aging Enhancement) */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Flavor Upgrade</h4>
                            <div className="space-y-2">
                                {AGING_ENHANCEMENT_OPTIONS.map((opt) => {
                                    const added = (activeOptionsBarrel.enhancements ?? []).includes(opt.id)
                                    const liters = BARREL_LITERS[activeOptionsBarrel.capacity] ?? 0
                                    const totalForThisBarrel = liters * opt.pricePerLiterZp
                                    return (
                                        <div
                                            key={opt.id}
                                            className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-xs ${added ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-background/60"
                                                }`}
                                        >
                                            <div>
                                                <span className="font-semibold text-foreground block">{opt.label}</span>
                                                <span className="text-[10px] text-muted-foreground">{opt.tagline}</span>
                                            </div>
                                            {added ? (
                                                <Badge className="bg-emerald-500 text-black border-none text-[10px] flex items-center gap-1 whitespace-nowrap">
                                                    <CheckCircle2 className="w-3 h-3" /> Đã thêm
                                                </Badge>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={optionsBusy}
                                                    className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-semibold whitespace-nowrap"
                                                    onClick={() => handleAddEnhancement(opt.id)}
                                                >
                                                    Thêm +{totalForThisBarrel.toLocaleString()} ZP
                                                    <span className="font-normal opacity-80"> ({liters}L × {opt.pricePerLiterZp.toLocaleString()})</span>
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Finishing */}
                        <div className="space-y-2 border-t border-border/40 pt-4">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Tùy chọn Finishing</h4>
                            {activeOptionsBarrel.finishing ? (
                                <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-3 text-xs">
                                    <span className="font-semibold text-foreground">
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeOptionsBarrel.finishing?.id)?.icon}{" "}
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeOptionsBarrel.finishing?.id)?.label}
                                    </span>
                                    <span className="text-muted-foreground"> · Mong muốn {activeOptionsBarrel.finishing.days} ngày (giới hạn 1 lần/thùng)</span>
                                    <p className="mt-1 text-[11px]">
                                        {activeOptionsBarrel.finishing.startedAt ? (
                                            <span className="text-emerald-500 font-semibold">
                                                Blend Master ZenTaro đang áp dụng (bắt đầu: {new Date(activeOptionsBarrel.finishing.startedAt).toLocaleDateString()})
                                            </span>
                                        ) : (
                                            <span className="text-amber-500 font-semibold">Đã tiếp nhận đăng ký · Đang chờ Blend Master ZenTaro áp dụng</span>
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {FINISHING_OPTION_SPECS.map((f) => {
                                            const liters = BARREL_LITERS[activeOptionsBarrel.capacity] ?? 0
                                            const totalForThisBarrel = liters * f.pricePerLiterZp
                                            return (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFinishId(f.id)
                                                        setFinishDays(f.minDays)
                                                    }}
                                                    className={`text-left p-2.5 rounded-lg border text-[11px] transition-all ${selectedFinishId === f.id
                                                        ? "border-amber-500 bg-amber-500/5"
                                                        : "border-border/60 bg-background/60 hover:border-amber-500/30"
                                                        }`}
                                                >
                                                    <span className="font-semibold text-foreground block">{f.icon} {f.label}</span>
                                                    <span className="text-amber-500 font-bold block">
                                                        {totalForThisBarrel.toLocaleString()} ZP
                                                        <span className="text-muted-foreground font-normal"> ({liters}L × {f.pricePerLiterZp.toLocaleString()} ZP/L)</span>
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">{f.minDays}~{f.maxDays} ngày</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {(() => {
                                        const opt = FINISHING_OPTION_SPECS.find((f) => f.id === selectedFinishId)
                                        if (!opt) return null
                                        const liters = BARREL_LITERS[activeOptionsBarrel.capacity] ?? 0
                                        const cost = liters * opt.pricePerLiterZp
                                        return (
                                            <div className="rounded-lg border border-border/40 bg-background/60 p-3 space-y-2">
                                                <p className="text-[11px] text-muted-foreground">{opt.effect}</p>
                                                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    Thời gian áp dụng (ngày)
                                                    <input
                                                        type="number"
                                                        min={opt.minDays}
                                                        max={opt.maxDays}
                                                        value={finishDays}
                                                        onChange={(e) => setFinishDays(Number(e.target.value))}
                                                        className="w-20 rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
                                                    />
                                                    <span>(khoảng {opt.minDays}~{opt.maxDays} ngày)</span>
                                                </label>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        Chi phí dự kiến: <span className="text-amber-500 font-bold">{cost.toLocaleString()} ZP</span> (theo {liters}L)
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={optionsBusy || finishDays < opt.minDays || finishDays > opt.maxDays}
                                                        className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                                                        onClick={handleApplyFinishing}
                                                    >
                                                        Đăng ký Finishing
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Public Gallery Detail View — applied options + Blend Master Evaluation (admin can edit inline) */}
            {activeDetailBarrel && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-border/40 pb-3">
                            <div>
                                <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-1.5">
                                    <Award className="w-4.5 h-4.5 text-amber-500" />
                                    Thông tin chi tiết thùng
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                                    {activeDetailBarrel.id} · {activeDetailBarrel.capacity} · {activeDetailBarrel.ownerLabel}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground text-sm"
                                onClick={() => setActiveDetailBarrel(null)}
                            >
                                Đóng [✕]
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Tùy chọn đã áp dụng</h4>
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500">
                                    {CHAR_LEVEL_LABEL[activeDetailBarrel.charLevel ?? "char3"] ?? activeDetailBarrel.charLevel}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] border-border/60 text-muted-foreground">
                                    {AGING_ENVIRONMENT_OPTIONS.find((e) => e.id === activeDetailBarrel.agingEnvironment)?.label ?? "Premium Barrel Room"}
                                </Badge>
                                {(activeDetailBarrel.enhancements ?? []).map((eid) => (
                                    <Badge key={eid} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">
                                        {AGING_ENHANCEMENT_OPTIONS.find((e) => e.id === eid)?.label ?? eid}
                                    </Badge>
                                ))}
                                {activeDetailBarrel.finishing && (
                                    <Badge variant="outline" className="text-[9px] border-pink-500/30 text-pink-400">
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeDetailBarrel.finishing?.id)?.icon}{" "}
                                        {FINISHING_OPTION_SPECS.find((f) => f.id === activeDetailBarrel.finishing?.id)?.label ?? activeDetailBarrel.finishing.id}
                                        {" "}({activeDetailBarrel.finishing.startedAt ? "đang áp dụng" : "đang chờ"})
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-border/40 pt-4">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Đánh giá của Blend Master ZenTaro</h4>
                            <div className="rounded-lg border border-border/40 bg-background/60 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < scoreToStarCount(activeDetailBarrel.blendMasterScore ?? 0) ? "fill-amber-500 text-amber-500" : "text-zinc-700"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        Hệ số tăng trưởng năm <span className="font-bold text-amber-500">
                                            {(1 + (activeDetailBarrel.customAnnualGrowthRate ?? defaultGrowthRate)).toFixed(2)}x
                                        </span> /năm
                                    </span>
                                </div>
                                {typeof activeDetailBarrel.blendMasterScore === "number" && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono text-foreground">{activeDetailBarrel.blendMasterScore}/500 điểm</span>
                                        <span className="font-semibold text-amber-500">{scoreToGrade(activeDetailBarrel.blendMasterScore)}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                                    onClick={() => setShowRubric((v) => !v)}
                                >
                                    {showRubric ? "Ẩn tiêu chí đánh giá" : "Xem tiêu chí đánh giá (thang 500 điểm)"}
                                </button>
                                {showRubric && (
                                    <div className="rounded-md border border-border/40 bg-card/60 p-2.5 space-y-2.5 max-h-56 overflow-y-auto">
                                        {SCORING_RUBRIC.map((cat) => (
                                            <div key={cat.category} className="space-y-1">
                                                <div className="flex items-center justify-between text-[10px] font-semibold text-foreground">
                                                    <span>{cat.category}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                                    {cat.items.map((item) => (
                                                        <div key={item.label} className="flex items-center justify-between text-[9px] text-muted-foreground">
                                                            <span>{item.label}</span>
                                                            <span className="font-mono">{item.points}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-border/40 pt-2 space-y-0.5">
                                            {[
                                                ["480~500", "💎 Diamond Barrel"],
                                                ["460~479", "🥇 Platinum Barrel"],
                                                ["440~459", "🟨 Gold Barrel"],
                                                ["420~439", "⚪ Silver Barrel"],
                                                ["400~419", "🟫 Bronze Barrel"],
                                                ["380~399", "Standard"],
                                                ["< 380", "Khuyến nghị ủ lại hoặc blend thêm"],
                                            ].map(([range, label]) => (
                                                <div key={range} className="flex items-center justify-between text-[9px]">
                                                    <span className="font-mono text-muted-foreground">{range}</span>
                                                    <span className="text-foreground">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeDetailBarrel.blendMasterComment ? (
                                    <p className="text-xs text-foreground/80 leading-relaxed">{activeDetailBarrel.blendMasterComment}</p>
                                ) : !isAdmin ? (
                                    <p className="text-xs text-muted-foreground">Chưa có nhận xét đánh giá nào được ghi nhận.</p>
                                ) : null}
                            </div>

                            {isAdmin && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-amber-500">블렌드마스터 평가 입력 (관리자)</span>
                                        <button
                                            type="button"
                                            className="text-[10px] text-muted-foreground underline"
                                            onClick={() => setUseEvalBreakdown((v) => !v)}
                                        >
                                            {useEvalBreakdown ? "총점 직접 입력으로 전환" : "세부 항목별 입력 (선택)"}
                                        </button>
                                    </div>

                                    {useEvalBreakdown ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                ["Hương (Aroma)", 200, evalAroma, setEvalAroma],
                                                ["Vị (Palate)", 180, evalPalate, setEvalPalate],
                                                ["Hậu vị (Finish)", 70, evalFinish, setEvalFinish],
                                                ["Chất lượng thùng", 50, evalBarrelQuality, setEvalBarrelQuality],
                                            ] as const).map(([label, max, val, setter]) => (
                                                <label key={label} className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-muted-foreground">{label} (/{max})</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={max}
                                                        value={val}
                                                        onChange={(e) =>
                                                            setter(Math.max(0, Math.min(max, Number(e.target.value) || 0)))
                                                        }
                                                        className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm text-foreground"
                                                    />
                                                </label>
                                            ))}
                                            <div className="col-span-2 flex items-center gap-2 pt-1">
                                                <span className="text-[11px] text-foreground font-semibold">
                                                    Tổng: {evalAroma + evalPalate + evalFinish + evalBarrelQuality} / 500
                                                </span>
                                                <span className="text-[11px] text-amber-500 font-semibold">
                                                    → 연 {((1 + defaultGrowthRate) + (evalAroma + evalPalate + evalFinish + evalBarrelQuality) / 100).toFixed(2)}x
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={500}
                                                value={evalScoreInput}
                                                onChange={(e) =>
                                                    setEvalScoreInput(Math.max(0, Math.min(500, Number(e.target.value) || 0)))
                                                }
                                                className="w-20 rounded-md border border-border/60 bg-background px-2 py-1 text-sm text-foreground"
                                            />
                                            <span className="text-[10px] text-muted-foreground">/ 500점</span>
                                            <span className="text-[11px] text-amber-500 font-semibold">
                                                → 연 {((1 + defaultGrowthRate) + evalScoreInput / 100).toFixed(2)}x
                                            </span>
                                        </div>
                                    )}

                                    <textarea
                                        className="w-full min-h-16 rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs text-foreground"
                                        placeholder="평가 코멘트 (비워두면 AI가 베트남어로 자동 생성)"
                                        value={evalCommentInput}
                                        onChange={(e) => setEvalCommentInput(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        코멘트를 비워두고 저장하면 점수(및 세부 항목)를 바탕으로 AI가 베트남어 코멘트를 자동 생성합니다.
                                    </p>
                                    {evalError ? <p className="text-[11px] text-destructive">{evalError}</p> : null}
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={evalBusy}
                                        className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                                        onClick={handleSaveEvaluation}
                                    >
                                        {evalBusy ? "저장 중..." : "평가 저장"}
                                    </Button>
                                </div>
                            )}
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
                                Thông tin quét QR thời gian thực
                            </h3>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground text-xs"
                                onClick={() => setActiveQrBarrel(null)}
                            >
                                Đóng ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-muted-foreground">
                            <p className="text-center font-mono text-[10px] bg-background p-2 rounded border border-border/40 text-foreground">
                                https://zentaro.netlify.app/verify/barrel?key={activeQrBarrel.qrKey}
                            </p>

                            <div className="space-y-2 divide-y divide-border/20 pt-1">
                                <div className="flex justify-between py-1.5">
                                    <span>Mã thùng :</span>
                                    <span className="text-foreground font-mono font-semibold">{activeQrBarrel.id}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>UID chủ sở hữu hiện tại :</span>
                                    <span className="text-foreground font-mono truncate max-w-40">{activeQrBarrel.userId}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>Thời gian ủ tích lũy :</span>
                                    <span className="text-foreground font-mono font-semibold text-[10px]">
                                        {formatAgingDuration(agingSecondsFor(activeQrBarrel.productionDate, activeQrBarrel.agingEndedAt))}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>Trạng thái thùng hiện tại :</span>
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                                        {statusLabelVi(activeQrBarrel.status)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>Timestamp Seal :</span>
                                    <Badge className="bg-emerald-500 text-black border-none text-[10px] font-bold">
                                        {activeQrBarrel.sealStatus}
                                    </Badge>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span>Đã giao hàng :</span>
                                    <span className="text-foreground">
                                        {activeQrBarrel.status.includes("배송") ? "Đã giao hàng" : "Đang lưu trữ tại Barrel Room"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-amber-500 leading-normal">
                            💡 Quét mã QR hologram gắn trên thùng thực tế bằng camera điện thoại sẽ tự động chuyển đến màn hình xác minh thông tin giống như thế này.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
