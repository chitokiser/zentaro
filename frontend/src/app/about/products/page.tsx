"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Award, Beaker, Check, HelpCircle, Info, Sparkles } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ProductBrandInfo {
    id: string
    image: string
    tagline: { ko: string; en: string; vi: string }
    category: { ko: string; en: string; vi: string }
    specs: {
        abv?: string
        volume?: string
        reward?: string
        woodType?: string
        size?: string
    }
    desc: { ko: string; en: string; vi: string }
    features: { ko: string[]; en: string[]; vi: string[] }
    ingredients: { ko: string; en: string; vi: string }
}

const BRAND_PRODUCTS: ProductBrandInfo[] = [
    {
        id: "zentaro-blue",
        image: "/images/products/zentaro_blue.png",
        category: {
            ko: "시그니처 드라이진",
            en: "Signature Dry Gin",
            vi: "Signature Dry Gin",
        },
        tagline: {
            ko: "베트남 고산지대의 야생 보태니컬을 품은 런던 드라이진",
            en: "London Dry Gin crafted with Vietnamese high-altitude wild botanicals",
            vi: "Dòng rượu London Dry Gin kết hợp thảo mộc hoang dã Tây Bắc",
        },
        specs: {
            abv: "43%",
            volume: "700ml",
            reward: "30,000 EXP",
        },
        desc: {
            ko: "런던 드라이진의 엄격한 제조 원칙을 고수하여 구리 증류기에서 정교하게 단식 증류한 젠타로의 시그니처 드라이 진입니다. 엄선한 주니퍼 베리를 밀 하이 알코올 스피릿에 침출하고, 베트남 청정 자연에서 거둔 레몬그라스, 카다멈, 스타아니스, 코리앤더 시드 등을 유기적으로 조화시켜 동양적이면서도 산뜻한 풍미와 실크처럼 부드러운 피니시를 선사합니다.",
            en: "A premium craft gin distilled in traditional copper stills adhering to strict London Dry Gin standards. Infused with wild high-altitude lemongrass, cardamom, star anise, and organic coriander seeds, it delivers an exotic yet refreshing harmony with a silky smooth, crisp botanical wrap.",
            vi: "Dòng Gin thủ công cao cấp được chưng cất tỉ mỉ trong tĩnh đồng theo tiêu chuẩn London Dry Gin nghiêm ngặt. Sự kết hợp giữa quả bách xù hương thơm đậm và các thảo mộc nhiệt đới chọn lọc như sả nghệ, thanh quế, thảo quả đem lại vị cay êm dịu, sảng khoái kéo dài.",
        },
        features: {
            ko: [
                "100% 천연 로컬 보태니컬 핸드픽 수확",
                "소형 구리 증류기(Copper Still) 정밀 증류",
                "레몬그라스와 카다멈이 연출하는 상쾌한 시트러스 피니시",
                "병뚜껑 QR 반납 시 Ztaro 토큰/30,000 EXP 즉시 보상",
            ],
            en: [
                "100% organic handpicked local botanicals",
                "Small-batch precision copper pot distillation",
                "Refreshing citrus notes driven by lemongrass and fresh cardamom",
                "Scan cap QR to claim 30,000 EXP or Ztaro tokens instantly",
            ],
            vi: [
                "100% thảo mộc hữu cơ tự nhiên thu hoạch thủ công",
                "Chưng cất mẻ nhỏ tinh khiết qua hệ thống tĩnh đồng",
                "Hương cam chanh sảng khoái nguyên bản thơm mát từ sả",
                "Quét mã QR nắp chai nhận ngay 30.000 EXP tích luỹ",
            ],
        },
        ingredients: {
            ko: "주니퍼 베리, 레몬그라스, 카다멈, 고수 씨앗, 팔각, 감초, 초피나무 열매",
            en: "Juniper berries, Lemongrass, Cardamom, Coriander seed, Star anise, Licorice root, Szechuan pepper",
            vi: "Quả bách xù, Sả, Thảo quả, Hạt ngò, Đại hồi, Cam thảo, Tiêu rừng",
        },
    },
    {
        id: "zentaro-origin",
        image: "/images/products/zentaro_origin.png",
        category: {
            ko: "명품 증류식 소주",
            en: "Premium Distilled Soju",
            vi: "Premium Distilled Soju",
        },
        tagline: {
            ko: "국산 쌀 100%와 전통 누룩으로 옹기 숙성한 정통 명주",
            en: "Traditional Korean single-source rice spirit aged in clay pots",
            vi: "Soju chưng cất truyền thống được ủ đằm trong chum đất nung",
        },
        specs: {
            abv: "25% / 41%",
            volume: "500ml",
            reward: "10,000 EXP",
        },
        desc: {
            ko: "최적의 발효주를 만들어내는 전통 방식을 고조시켜 한국산 특등급 쌀과 직접 디딘 통밀 누룩만을 사용하여 감미했습니다. 단 한 방울의 화학 첨가물도 허용하지 않고 감압 증류하여 찌꺼기 없는 깔끔한 목 넘김을 완성하였으며, 베트남 하노이 젠타로 셀러의 옹기 항아리에서 장기 저온 숙성을 거쳐 은은한 막걸리 원액의 고소한 감칠맛과 묵직한 바디감을 완성했습니다.",
            en: "A noble spirit crafted purely with hand-steeped traditional wheat starter and top-grade single-origin rice. Free from any chemical additives, it undergoes low-temperature vacuum distillation for unparalleled clarity, and is slow-aged in traditional breathable clay jars to unlock deep grain umami and a smooth texture.",
            vi: "Sản phẩm chưng cất thượng hạng tinh tuyển từ 100% gạo thơm chất lượng cao kết hợp men bánh truyền thống. Hệ thống chưng cất áp suất giảm loại bỏ hoàn toàn độc tố, kết hợp thời gian ủ dài trong các chum sành đất nung mang lại vị ngọt hậu tự nhiên của lúa chín.",
        },
        features: {
            ko: [
                "100% 특등급 쌀 수매 원료화",
                "감압 증류 방식을 통해 알데히드 성분을 극소화하여 취기 최소화",
                "숨쉬는 옹기 항아리 저온 숙성으로 깊어지는 특유의 누룩 피니시",
                "병뚜껑 QR 반납 시 Ztaro 토큰/10,000 EXP 즉시 보상",
            ],
            en: [
                "Sourced using 100% top-grade local agricultural rice",
                "Vacuum distilled at low temperature to eliminate harsh congeners",
                "Aged in breathable premium clay jars for rich grain esters",
                "Scan cap QR to claim 10,000 EXP or Ztaro tokens instantly",
            ],
            vi: [
                "Sản xuất từ nguồn gạo sạch nguyên hạt chọn lọc",
                "Công nghệ chưng cất chân không loại bỏ đau đầu và tạp chất",
                "Ủ già trong chum sành tự nhiên tạo vị êm sâu tròn đầy",
                "Quét mã QR nắp chai đổi ngay 10.000 EXP vào ví mua sắm",
            ],
        },
        ingredients: {
            ko: "쌀 100%, 누룩, 정제수",
            en: "Rice 100%, Wheat yeast starter, Purified water",
            vi: "Gạo thơm 100%, Men bánh tự nhiên, Nước tinh khiết",
        },
    },
    {
        id: "zentaro-st",
        image: "/images/products/zentaro_st.png",
        category: {
            ko: "프리미엄 딸기 리큐르",
            en: "Premium Strawberry Liqueur",
            vi: "Rượu mùi dâu tây cao cấp",
        },
        tagline: {
            ko: "무색무취의 젠타로 스피릿에 신선한 딸기 원액을 더해 탄생한 과실 리큐르",
            en: "Premium strawberry liqueur crafted by infusing pure strawberry extract into odorless and tasteless Zentaro spirits",
            vi: "Rượu mùi dâu tây ngọt ngào được chiết xuất trên nền rượu tinh khiết",
        },
        specs: {
            abv: "15%",
            volume: "500ml",
            reward: "20,000 EXP",
        },
        desc: {
            ko: "불순물과 특유의 취기를 완벽하게 제거하여 맑고 깨끗한 무색무취의 프리미엄 젠타로 스피릿을 기주로 삼아, 엄선된 100% 천연 딸기 원액을 저온으로 천천히 슬로 침출해 빚어낸 프리미엄 딸기 리큐르입니다. 한 모금 머금는 순간, 산뜻하고 상큼한 딸기 본연의 감미로운 참맛이 입안 가득 화사하게 감돌며 인공 향료나 인공 색소를 첨가하지 않아 과실 본연의 루비색 뉘앙스가 띄는 맑고 깔끔한 피니시를 선사합니다.",
            en: "Built with ultra-pure, odorless and tasteless premium Zentaro spirit as its foundation, this premium liqueur infuses 100% natural, hand-selected strawberry concentrate at low temperatures. It delivers the vibrant, jammy sweetness of ripe strawberries immediately on the palate. Made completely free of artificial flavorings or synthetic colorings, it holds a clean crystal ruby appearance and a refreshing, natural dessert-like finish.",
            vi: "Sử dụng rượu nền (spirit) tinh khiết đã lọc khử mùi hoàn toàn của Zentaro làm cốt rượu, kết hợp ngâm ủ nước ép dâu tây tự nhiên chín ngọt. Lớp màu đỏ ruby tự nhiên tuyệt đẹp không hóa chất phẩm màu, mang đến hương vị dâu chua ngọt căng mọng đậm đà.",
        },
        features: {
            ko: [
                "100% 천연 딸기 원액 저온 슬로 침출 기법(Slow Maceration)",
                "불순물과 잡향을 모두 걸러낸 깔끔한 무색무취의 젠타로 전용 기주 사용",
                "인공 보존제, 화학 감미료, 인공 타르 색소 무첨가 원칙 준수",
                "병뚜껑 반납 심사 완료 시 20,000 EXP 포인트 적립 연계",
            ],
            en: [
                "100% natural strawberry concentrate via low temperature slow maceration",
                "Odorless and tasteless premium base spirit for pure fruit expressiveness",
                "Strict chemical-free manufacturing with no artificial colors or additives",
                "Claim 20,000 EXP rewards upon bottle cap verification",
            ],
            vi: [
                "Chiết xuất chậm từ 100% trái dâu tây tươi tự nhiên chín mọng",
                "Sử dụng rượu nền lọc tinh khiết không màu không mùi cao cấp",
                "Nói không với phẩm màu nhân tạo và chất bảo quản hoá học",
                "Đổi nắp chai nhận ngay 20.000 EXP thưởng khi kiểm duyệt",
            ],
        },
        ingredients: {
            ko: "젠타로 스피릿 (쌀 기주), 천연 딸기 원액 100%, 천연 당분, 정제수",
            en: "Zentaro base spirit, 100% natural strawberry extract, natural sugar cane, purified water",
            vi: "Rượu nền tinh khiết, nước ép dâu tây nguyên chất 100%, đường mía tự nhiên, nước tinh khiết",
        },
    },
    {
        id: "zentaro-an",
        image: "/images/products/zentaro_an2.png",
        category: {
            ko: "프리미엄 압생트",
            en: "Premium Absinthe",
            vi: "Rượu Absinthe cao cấp",
        },
        tagline: {
            ko: "베트남 와일드 웜우드(쑥)와 고산지대 허브로 빚어낸 녹색의 요정",
            en: "The Green Fairy crafted with Vietnamese wild wormwood and alpine herbs",
            vi: "Nàng tiên xanh chưng cất từ ngải cứu hoang dã và thảo mộc Tây Bắc",
        },
        specs: {
            abv: "55% / 68%",
            volume: "500ml",
            reward: "40,000 EXP",
        },
        desc: {
            ko: "예술가들의 영감의 원천이었던 '녹색 요정(Green Fairy)' 압생트를 젠타로의 독창적인 관점으로 재해석한 전통 크래프트 스피릿입니다. 라이(Rye) 스피릿 기주에 베트남 야생 쑥(Wormwood/Ngải Cứu)과 향긋한 아니스, 펜넬 등의 약초를 정교하게 우려낸 뒤 추가 증류를 거쳐 압생트 특유의 투명한 연록빛 색감과 깊고 복합적인 리코리스 향취를 고스란히 담아냈습니다. 물을 서서히 떨어뜨릴 때 번지는 매혹적인 오팔색 탁화 현상(Louche Effect)을 감상할 수 있습니다.",
            en: "Reimagined through ZenTaro's lens, this 'Green Fairy' craft Absinthe uses wild Vietnamese wormwood (Ngải Cứu) alongside aromatic anise and fennel seed infused into a rich rye spirit base. Followed by meticulous double distillation, it preserves the bright natural pale-green color and deep, complex herbal wormwood finish. Adding iced water drop by drop yields the magical opalescent louche effect.",
            vi: "Tái hiện huyền thoại 'Nàng tiên xanh' (Green Fairy) dưới lăng kính nghệ thuật của ZenTaro. Sự kết hợp giữa ngải cứu hoang dã Tây Bắc (Ngải Cứu), tiểu hồi hương và hương thảo mộc tự nhiên ngâm ủ trong rượu nền. Trải qua chưng cất kép giữ trọn sắc xanh trong veo tự nhiên cùng hiệu ứng vẩn đục (louche) huyền ảo khi thêm nước đá.",
        },
        features: {
            ko: [
                "베트남 북부 야생 천연 쑥(Wormwood) 핵심 침제 기법 적용",
                "인위적인 인공 색소가 전혀 없는 천연 허브 기반의 에메랄드 그린 색조",
                "냉수 희석 시 풍부한 에센셜 오일 방출로 극상의 Louche 탁화 감상 가능",
                "병뚜껑 QR 반납 심사 통과 시 40,000 EXP 포인트 즉시 적립",
            ],
            en: [
                "Wild high-altitude Vietnamese wormwood (Ngải cứu) maceration",
                "Natural emerald hue extracted purely from botanical chlorophyll (zero artificial dye)",
                "Rich essential oils release creating the legendary cloudy louche effect when diluted",
                "Claim 40,000 EXP rewards upon bottle cap verification",
            ],
            vi: [
                "Ngâm ủ từ lá ngải cứu tự nhiên thu hoạch trên đỉnh núi Hoàng Liên Sơn",
                "Màu xanh ngọc lục bảo tự nhiên chiết xuất từ diệp lục thảo mộc (không màu nhân tạo)",
                "Tinh dầu tự nhiên đậm đặc tạo hiệu ứng vẩn đục sương mù tuyệt đẹp khi pha nước lạnh",
                "Đội nắp chai quy đổi 40.000 EXP thưởng khi kiểm duyệt thành công",
            ],
        },
        ingredients: {
            ko: "베트남 야생 쑥(Wormwood), 스타아니스, 펜넬 씨앗, 멜리사, 히솝, 라이 스피릿 기주",
            en: "Vietnamese wild wormwood, Star anise, Fennel seed, Lemon balm, Hyssop, Rye spirit base",
            vi: "Lá ngải cứu Tây Bắc, đại hồi, tiểu hồi, tía tô đất, thần sa cát, rượu nền tinh khiết",
        },
    },
    {
        id: "zentaro-oak",
        image: "/images/products/oak/Oak barrel.png",
        category: {
            ko: "수제 프렌치 오크통",
            en: "Handcrafted Oak Barrel",
            vi: "Thùng gỗ sồi Nga vỗ thủ công",
        },
        tagline: {
            ko: "하노이 목도공의 땀방울과 젠타로 숙성 과학의 결정체",
            en: "Artisanal cooperage meets advanced aging science for premium home aging",
            vi: "Sự giao quyện giữa kỹ nghệ thợ mộc Hà Nội và khoa học ủ sồi",
        },
        specs: {
            size: "5L / 10L / 20L",
            woodType: "프렌치 화이트 오크 (French White Oak)",
        },
        desc: {
            ko: "하노이 근교의 대대손손 가업을 이어온 목공 명인들이 프랑스 등지에서 직수입한 프렌치 화이트 오크 원목을 건조, 수제 가공하여 어셈블링한 프리미엄 오크 배럴입니다. 화학 본드나 실리콘 접착제를 단 한 방울도 쓰지 않고 오직 정밀한 원목 밴딩과 대패 조립 기술만으로 내부 압력을 밀폐하여 누수를 차단했습니다. 젠타로 소주나 진을 넣는 순간 극상의 바닐라 에스테르와 태운 참나무의 훈연 아로마가 가미되어 나만의 한정판 명주를 연출할 수 있습니다.",
            en: "A majestic maturation barrel crafted by generational coopers in the outskirts of Hanoi using imported French White Oak. Assembled absolute glue-free and chemical-free using traditional fires and physical steel hooping to seal spirits hermetically. Elevates standard gin or traditional soju into amber nectar saturated with vanilla aldehydes and medium charred oak smoke.",
            vi: "Thùng sồi thủ công tinh chế bởi nghệ nhân mộc truyền thống Hà Nội từ gỗ sồi trắng nhập khẩu Bắc Âu. Hoàn toàn không hàn keo hay hoá chất bít trét, lắp ghép cơ học nén đai sắt kín hơi tuyệt đối. Giúp chuyển hoá rượu trắng thông thường thành rượu vàng hổ phách đượm hương vani khói.",
        },
        features: {
            ko: [
                "100% 수작업 미디엄 차링(Medium Charring) 처리",
                "접착제 및 화학 방부 처리가 전혀 없는 100% 무접착 친환경 공정",
                "가정 및 바 인테리어에 어울리는 고급 브라스 밸브 및 스탠드 동봉",
                "현물 출자(Contribution) 프로그램 참여 시 고율의 쇼핑머니 적립 연계",
            ],
            en: [
                "100% manual medium charring process over oak fires",
                "Pure chemical-free eco-friendly timber construction (zero glue)",
                "Includes premium brass faucet and polished solid wood display stand",
                "Fully integrated with our Contribution program for maximizing EXP earnings",
            ],
            vi: [
                "Đốt rám lòng thùng (medium charring) bằng lửa củi sồi tự nhiên",
                "Kết cấu gỗ sồi ghép khít tự nhiên, hoàn toàn không phụ gia hóa học",
                "Đầy đủ vòi đồng cao cấp và giá đỡ gỗ sồi nguyên khối trưng bày sang trọng",
                "Liên kết trực tiếp dự án Góp vốn hiện vật nhận chiết khấu EXP ưu đãi",
            ],
        },
        ingredients: {
            ko: "프렌치 화이트 오크 원목, 철제 밴드, 황동 주입구",
            en: "French White Oak heartwood, Carbon steel hoops, Brass spigot",
            vi: "Gỗ sồi trắng nhập khẩu, Vòng đai thép carbon, Vòi rót bằng đồng thau",
        },
    },
]

export default function ProductsPromotionalPage() {
    const { t, locale } = useI18n()
    const [activeTab, setActiveTab] = useState(BRAND_PRODUCTS[0].id)

    const selectedProduct = BRAND_PRODUCTS.find((p) => p.id === activeTab) || BRAND_PRODUCTS[0]

    return (
        <div className="bg-background text-foreground min-h-screen">
            {/* Dynamic Glassmorphic Hero Banner */}
            <div className="relative overflow-hidden border-b border-border/40 bg-zinc-950/60 pb-20 pt-24 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950 z-0" />
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 text-xs px-3 py-1 uppercase tracking-widest font-mono select-none">
                        ZENTARO CRAFT DISTILLERY
                    </Badge>
                    <h1 className="mt-6 font-display text-4xl font-extrabold sm:text-6xl tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                        {locale === "ko" ? "젠타로 크래프트 컬렉션" : locale === "vi" ? "Bộ Sưu Tập Của ZENTARO" : "ZENTARO Craft Collection"}
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
                        {locale === "ko"
                            ? "베트남 고산지대의 야생 약초, 깨끗한 천연수, 그리고 정통 장인의 증류 방식을 통해 완성한 젠타로의 독창적인 명품 프리미엄 제품군을 소개합니다."
                            : locale === "vi"
                                ? "Giới thiệu dòng sản phẩm thượng hạng độc bản được kết tinh từ thảo mộc thiên nhiên nhiệt đới núi cao và kỹ nghệ chưng cất gỗ sồi bậc thầy."
                                : "Discover ZenTaro's premium spirits and aging barrels crafted meticulously combining wild high-altitude botanicals and fine wooden cooperage."}
                    </p>
                </div>
            </div>

            {/* Main Container */}
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Navigation Tabs - Glassmorphism style */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {BRAND_PRODUCTS.map((prod) => (
                        <button
                            key={prod.id}
                            onClick={() => setActiveTab(prod.id)}
                            className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 border ${activeTab === prod.id
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-card hover:bg-secondary text-muted-foreground border-border hover:text-foreground"
                                }`}
                        >
                            {prod.category[locale]}
                        </button>
                    ))}
                </div>

                {/* Product Showcase Detail Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-card/30 rounded-3xl border border-border/80 p-8 sm:p-12 backdrop-blur-sm">
                    {/* Left Column: Product Image */}
                    <div className="lg:col-span-5 flex justify-center relative aspect-square w-full max-w-sm mx-auto overflow-hidden bg-zinc-950/40 rounded-2xl border border-border/60 shadow-2xl p-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent z-0 pointer-events-none" />
                        {selectedProduct.image ? (
                            <Image
                                src={selectedProduct.image}
                                alt={selectedProduct.category[locale]}
                                fill
                                className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 400px"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center text-zinc-500">No Image</div>
                        )}
                    </div>

                    {/* Right Column: Descriptions & Tech Specs */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                        <div>
                            <Badge variant="outline" className="border-primary/50 text-primary text-xs px-2.5 py-0.5 select-none font-mono">
                                {selectedProduct.category[locale]}
                            </Badge>
                            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                {selectedProduct.id.includes("blue")
                                    ? "ZENTARO BLUE DRY GIN"
                                    : selectedProduct.id.includes("origin")
                                        ? "ZENTARO ORIGIN SOJU"
                                        : selectedProduct.id.includes("st")
                                            ? "ZENTARO STRAWBERRY LIQUEUR"
                                            : selectedProduct.id.includes("an")
                                                ? "ZENTARO CRAFT ABSINTHE"
                                                : "ZENTARO OAK BARREL"}
                            </h2>
                            <p className="mt-3 text-lg font-medium text-amber-500 dark:text-amber-400">
                                &ldquo;{selectedProduct.tagline[locale]}&rdquo;
                            </p>
                        </div>

                        {/* Tech Specs Badge Container */}
                        <div className="flex flex-wrap gap-2 py-2 border-y border-border/60">
                            {selectedProduct.specs.abv && (
                                <div className="bg-secondary/60 px-4 py-2 rounded-lg text-xs">
                                    <span className="text-muted-foreground block">{locale === "ko" ? "알코올 도수" : locale === "vi" ? "Nồng độ cồn" : "ABV"}</span>
                                    <span className="font-semibold text-foreground">{selectedProduct.specs.abv}</span>
                                </div>
                            )}
                            {selectedProduct.specs.volume && (
                                <div className="bg-secondary/60 px-4 py-2 rounded-lg text-xs">
                                    <span className="text-muted-foreground block">{locale === "ko" ? "용량" : locale === "vi" ? "Dung tích" : "Volume"}</span>
                                    <span className="font-semibold text-foreground">{selectedProduct.specs.volume}</span>
                                </div>
                            )}
                            {selectedProduct.specs.size && (
                                <div className="bg-secondary/60 px-4 py-2 rounded-lg text-xs">
                                    <span className="text-muted-foreground block">{locale === "ko" ? "크기/용량 규격" : locale === "vi" ? "Dung tích thùng" : "Size Options"}</span>
                                    <span className="font-semibold text-foreground">{selectedProduct.specs.size}</span>
                                </div>
                            )}
                            {selectedProduct.specs.woodType && (
                                <div className="bg-secondary/60 px-4 py-2 rounded-lg text-xs">
                                    <span className="text-muted-foreground block">{locale === "ko" ? "나무 원목" : locale === "vi" ? "Chất liệu gỗ" : "Wood Type"}</span>
                                    <span className="font-semibold text-foreground">{selectedProduct.specs.woodType}</span>
                                </div>
                            )}
                            {selectedProduct.specs.reward && (
                                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg text-xs">
                                    <span className="text-primary block font-medium">{locale === "ko" ? "병뚜껑 리워드 캐시백" : locale === "vi" ? "Thưởng nắp chai" : "Cap Reward"}</span>
                                    <span className="font-bold text-primary">{selectedProduct.specs.reward}</span>
                                </div>
                            )}
                        </div>

                        {/* Description Text */}
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {selectedProduct.desc[locale]}
                        </p>

                        {/* Ingredients Section */}
                        <div className="flex gap-2 items-start bg-secondary/30 p-4 rounded-xl text-xs">
                            <Beaker className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-foreground block mb-0.5">
                                    {locale === "ko" ? "주요 원재료 & 보태니컬" : locale === "vi" ? "Nguyên liệu & Thảo mộc chính" : "Core Botanicals & Ingredients"}
                                </span>
                                <span className="text-muted-foreground font-mono">{selectedProduct.ingredients[locale]}</span>
                            </div>
                        </div>

                        {/* Features Bullet List */}
                        <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                                {locale === "ko" ? "핵심 특장점" : locale === "vi" ? "Điểm nổi bật chính" : "Key Characteristics"}
                            </span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-foreground/80">
                                {selectedProduct.features[locale].map((feat, idx) => (
                                    <li key={idx} className="flex gap-2 items-center">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Call to Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button asChild size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                                <Link href="/mall" className="gap-2 justify-center">
                                    {locale === "ko" ? "ZENTARO 몰에서 쇼핑하기" : locale === "vi" ? "Mua sắm tại ZENTARO Mall" : "Shop at ZENTARO Mall"}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            {selectedProduct.specs.reward && (
                                <Button asChild variant="outline" size="lg" className="flex-1 border-primary/50 text-primary hover:bg-secondary">
                                    <Link href="/rewards/bottle-cap" className="gap-2 justify-center">
                                        <Award className="h-4 w-4" />
                                        {locale === "ko" ? "병뚜껑 리워드 신청하기" : locale === "vi" ? "Nộp nắp chai nhận thưởng" : "Claim Cap Rewards"}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Oak Cask Maturation Ecosystem - Bottom Feature Callout */}
                <div className="mt-24 p-8 sm:p-12 rounded-3xl bg-zinc-950 border border-amber-500/20 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent z-0 pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-8 space-y-4">
                            <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 font-mono text-xs select-none">
                                {locale === "ko" ? "오크통 친환경 순환 경제" : locale === "vi" ? "Kinh tế tuần hoàn thùng sồi" : "Eco-friendly circular economy"}
                            </Badge>
                            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                {locale === "ko"
                                    ? "사고파는 가치를 넘어, 함께 숙성하는 젠타로 배럴 리저브"
                                    : locale === "vi"
                                        ? "Chương trình ZenTaro Barrel Reserve - Cùng nhau ủ chín giá trị"
                                        : "Beyond purchasing: Age together in the ZenTaro Barrel Reserve"}
                            </h3>
                            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                                {locale === "ko"
                                    ? "젠타로는 사용자가 보유한 오크통, 혹은 몰에서 구입한 프렌치 오크통에 젠타로의 스피릿을 채운 뒤, 젠타로 자체 전문 숙성 셀러(Barrel Cellar)에 정식 기탁하여 장기 에이징할 수 있는 고품격 '현물출자 기탁 리워드' 생태계를 제공합니다. 시간이 흐를수록 풍부해지는 알데히드와 황금빛 탄닌 에스테르처럼, 귀하의 기탁 자산도 EXP와 Ztaro 배당으로 매일 두텁게 축적됩니다."
                                    : locale === "vi"
                                        ? "ZenTaro cung cấp chương trình và hệ sinh thái 'góp vốn hiện vật' độc đáo. Các thùng gỗ sồi sau khi mua hoặc tự mang đến ký gửi sẽ được chứa đầy rượu cốt Gin/Soju thượng hạng và bảo quản nghiêm ngặt tại hầm gỗ chuyên dụng của hãng. Giá trị gia tăng theo thời gian được hoàn trả qua cơ chế chia sẻ EXP và Ztaro định kỳ."
                                        : "Through our unique Barrel Contribution Program, you can store your purchased or owned oak casks filled with ZenTaro spirits directly in our climate-controlled cellars. As the liquid matures, you receive daily EXP dividends and ecosystem rewards based on real-world assets."}
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Link
                                    href="/rewards/contribution"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300"
                                >
                                    {locale === "ko" ? "현물출자 규정 안내" : locale === "vi" ? "Quy định đóng góp" : "Read Contribution Rules"}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/rewards/barrel-reserve"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300"
                                >
                                    {locale === "ko" ? "배럴 리저브 대시보드" : locale === "vi" ? "Bảng điều khiển Barrel" : "Barrel Dashboard"}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="md:col-span-4 flex justify-center relative aspect-square w-full max-w-[240px] mx-auto bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 antialiased">
                            <Image
                                src="/images/products/oak/Oak barrel.png"
                                alt="ZenTaro Oak Barrel Aging"
                                fill
                                className="object-contain p-4 rotate-6"
                                sizes="200px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
