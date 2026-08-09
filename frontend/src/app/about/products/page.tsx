"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Award, Beaker, Check, HelpCircle, Info, Sparkles, Star, Trash2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"
import type { Locale } from "@/lib/i18n/translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    getToken,
    onAuthChanged,
    fetchMe,
    fetchProductReviews,
    submitProductReview,
    deleteProductReview,
    type ProductReview,
} from "@/lib/auth-client"

interface ProductBrandInfo {
    id: string
    brand: "zentaro" | "phuc-loc"
    displayName: string
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
    comingSoon?: boolean
    externalUrl?: string
}

const BRAND_PRODUCTS: ProductBrandInfo[] = [
    {
        id: "zentaro-blue",
        brand: "zentaro",
        displayName: "ZENTARO BLUE DRY GIN",
        comingSoon: true,
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
                "병뚜껑 인지세 봉인스티커 흔적을 남긴 채 반납·심사 완료 시 30,000 EXP 적립",
            ],
            en: [
                "100% organic handpicked local botanicals",
                "Small-batch precision copper pot distillation",
                "Refreshing citrus notes driven by lemongrass and fresh cardamom",
                "Return the cap with its tax-seal sticker trace intact for a 30,000 EXP reward after verification",
            ],
            vi: [
                "100% thảo mộc hữu cơ tự nhiên thu hoạch thủ công",
                "Chưng cất mẻ nhỏ tinh khiết qua hệ thống tĩnh đồng",
                "Hương cam chanh sảng khoái nguyên bản thơm mát từ sả",
                "Gửi lại nắp chai còn dấu tem niêm phong thuế để nhận 30.000 EXP sau khi xác minh",
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
        brand: "zentaro",
        displayName: "ZENTARO ORIGIN SOJU",
        comingSoon: false,
        image: "/images/products/zentaro_origin.png",
        category: {
            ko: "수제명품 증류식소주",
            en: "Premium Distilled Soju",
            vi: "Premium Distilled Soju",
        },
        tagline: {
            ko: "오크 없이, 구리 증류기 두 번의 증류만으로 완성한 향의 예술",
            en: "The Art of Double Distillation — no oak, just two passes through a copper pot still",
            vi: "Nghệ thuật chưng cất kép — không ủ sồi, chỉ hai lần chưng cất qua tĩnh đồng",
        },
        specs: {
            abv: "17%",
            volume: "350ml",
            reward: "10,000 EXP",
        },
        desc: {
            ko: "쌀과 발효, 그리고 구리 증류기(Copper Pot Still)에서 두 번의 증류로 향을 완성하고, 레몬그라스·고수씨·감초 등 극소량의 천연 허브로 은은한 악센트를 더한 프리미엄 수제 증류식 소주입니다. 오크 숙성 없이도 위스키에 견줄 만큼 깊고 풍부한 향을 구현했습니다. 몇 년씩 오크통에서 나무 향을 빌려오는 대신, 전통적인 구리 증류기에서 두 차례 정성껏 증류하고, 정밀한 컷(Heads, Hearts, Tails) 기술을 통해 배와 풋사과를 연상시키는 에스테르 향을 최대한 살렸습니다. 그 결과 숙성에 의존하지 않고도 깨끗하면서도 입체적인 향과 부드러운 질감을 완성했으며, 위스키보다 더욱 합리적인 가격으로 즐길 수 있습니다.\n\n베이스는 2019년 필리핀 마닐라 World Rice Conference에서 '세계 최고의 쌀'로 선정된 ST25 품종입니다. 여기에 구연산 생성 능력이 뛰어난 흑국균(Black Koji)으로 당화를 진행하고, 선별한 효모를 사용하여 깨끗하고 안정적인 발효를 완성했습니다. 흑국균이 만드는 구연산은 발효 중 잡균의 증식을 억제하고, 효모는 쌀의 당을 알코올과 풍부한 과실향으로 바꾸어 젠타로 오리진만의 섬세한 향을 만들어냅니다.\n\n발효를 마친 술은 전통 구리 증류기(Copper Pot Still)에서 두 차례 증류됩니다. 1차 증류로 얻은 원주를 다시 한 번 증류하며, 재증류 과정에서는 가장 향이 풍부한 하트 컷(Heart Cut)을 중심으로 컷을 깊게 가져가 배·풋사과 계열의 에스테르 향을 최대한 담아냅니다. 구리는 황화합물과 같은 불쾌한 향을 줄이고 증류주의 향을 더욱 깨끗하고 부드럽게 다듬는 특성이 있어, 젠타로 오리진 특유의 맑고 우아한 향을 완성하는 중요한 역할을 합니다. 이 과정에서 함께 따라오는 거친 맛은 저온 여과와 활성탄 처리를 통해 선택적으로 제거합니다. 향은 최대한 보존하고, 결점만 덜어내는 것이 젠타로 오리진의 철학입니다.\n\n젠타로 오리진은 오크통에서 숙성하지 않습니다. 대신 스테인리스 탱크에서 충분한 정치(靜置) 과정을 거쳐 술을 안정시키고, 두 번의 증류와 정밀한 여과 공정으로 완성된 향을 그대로 유지합니다. 시간이 만들어내는 것은 나무 향이 아니라, 쌀과 발효, 그리고 증류 기술이 빚어낸 본연의 풍미입니다.\n\n젠타로 오리진은 대량생산 소주가 아닙니다. 연간 10만 병(약 35,000리터) 이하만 생산하며, 이는 PHUC LOC 증류소의 전체 생산 능력 중 일부만을 배정한 한정 생산 제품입니다. 더 많이 만들 수 없어서가 아니라, 품질을 위해 더 만들지 않기로 선택했습니다. 증류 컷 하나, 여과 한 번까지 장인의 손으로 확인하는 수작업 공정을 고집하기 때문에 생산량을 쉽게 늘릴 수 없습니다.\n\n첫 향에서는 잘 익은 배와 풋사과를 연상시키는 은은한 에스테르 향이 펼쳐지고, 이어서 깨끗한 쌀의 풍미와 레몬그라스·고수씨·감초가 만드는 은은한 허브 악센트, 부드러운 질감이 조화를 이룹니다. 인공 향료도, 색소도, 감미료도 넣지 않았습니다. 쌀과 물, 흑국균, 효모, 극소량의 천연 허브, 그리고 구리 증류기에서의 두 번의 증류. 그것이 젠타로 오리진의 모든 것입니다.",
            en: "A premium handcrafted distilled soju built on rice, fermentation, and two passes through a traditional copper pot still, finished with a whisper-light accent of natural herbs — lemongrass, coriander seed, and licorice among them. Without a single day of oak aging, it achieves an aroma deep and layered enough to rival whisky. Instead of borrowing wood character from years in an oak barrel, we distill twice with meticulous care in a traditional copper pot still, using precise cutting (heads, hearts, tails) to preserve pear- and green-apple-like ester aromas at their fullest. The result is a clean yet multidimensional aroma and a smooth texture achieved without relying on aging — offered at a far more accessible price than whisky.\n\nThe base is ST25 rice, named 'the world's best rice' at the 2019 World Rice Conference in Manila, Philippines. Saccharification is carried out with Black Koji, prized for its strong citric-acid production, then fermented with selected yeast for a clean, stable result. The citric acid Black Koji produces suppresses unwanted microbial growth during fermentation, while the yeast converts the rice's sugars into alcohol and rich fruity aromas, creating ZENTARO Origin's signature delicate character.\n\nOnce fermentation is complete, the spirit is distilled twice in a traditional copper pot still. The raw spirit from the first distillation is distilled again, with the cut taken deep around the aromatic Heart Cut to capture as much of the pear and green-apple ester character as possible. Copper reduces harsh notes like sulfur compounds and refines the spirit into something cleaner and smoother — a key part of what gives ZENTARO Origin its clear, elegant character. The coarse notes that come along the way are selectively removed through cold filtration and activated-carbon treatment. Preserving the aroma while trimming only the flaws — that is ZENTARO Origin's philosophy.\n\nZENTARO Origin is not aged in oak. Instead, it rests in stainless steel tanks long enough to stabilize, keeping the aroma achieved through double distillation and precise filtration exactly as it is. What time creates here is not wood character, but the natural flavor born purely from rice, fermentation, and distillation craft.\n\nZENTARO Origin is not mass-produced soju. We make no more than 100,000 bottles (about 35,000 liters) a year — a limited allocation of PHUC LOC Distillery's total capacity. Not because we can't make more, but because we chose not to, for the sake of quality. Every cut of the distillation and every round of filtration is checked by hand, which naturally limits how much we can produce.\n\nThe first note opens with a subtle ester aroma reminiscent of ripe pear and green apple, followed by clean rice character, a whisper of herbal accent from lemongrass, coriander seed, and licorice, and a smooth texture in harmony. No artificial fragrance, no coloring, no sweeteners. Rice, water, Black Koji, yeast, a trace of natural herbs, and two distillations through a copper pot still. That is everything ZENTARO Origin is.",
            vi: "Rượu soju chưng cất thủ công cao cấp từ gạo, lên men và hai lần chưng cất qua tĩnh đồng truyền thống (Copper Pot Still), điểm xuyết một chút thảo mộc tự nhiên như sả, hạt ngò và cam thảo. Không cần ủ sồi, hương vị vẫn sâu và phong phú không kém whisky. Thay vì mượn hương gỗ từ nhiều năm ủ trong thùng sồi, chúng tôi chưng cất hai lần tỉ mỉ qua tĩnh đồng truyền thống, kết hợp kỹ thuật cắt lát chính xác (Heads, Hearts, Tails) để giữ trọn hương ester gợi nhớ lê và táo xanh. Kết quả là hương thơm trong trẻo nhưng đa chiều và kết cấu mềm mại mà không cần dựa vào thời gian ủ — với mức giá hợp lý hơn nhiều so với whisky.\n\nNguyên liệu nền là giống gạo ST25 — được vinh danh 'gạo ngon nhất thế giới' tại Hội nghị Gạo Thế giới 2019 tại Manila, Philippines. Quá trình đường hóa sử dụng men Khúc Đen (Black Koji) với khả năng sinh axit citric vượt trội, kết hợp men rượu chọn lọc để lên men sạch và ổn định. Axit citric do Black Koji tạo ra ức chế sự phát triển của vi khuẩn lạ trong quá trình lên men, còn men rượu chuyển hóa đường trong gạo thành cồn và hương trái cây phong phú, tạo nên nét tinh tế đặc trưng của ZENTARO Origin.\n\nSau khi lên men xong, rượu được chưng cất hai lần qua tĩnh đồng truyền thống. Rượu thô từ lần chưng cất đầu tiên được chưng cất lại lần nữa, với phần cắt tập trung sâu vào Heart Cut giàu hương thơm nhất để giữ trọn hương ester gợi nhớ lê và táo xanh. Đồng có đặc tính giảm các hợp chất lưu huỳnh khó chịu và làm hương rượu trong trẻo, mềm mại hơn — đóng vai trò quan trọng trong việc hoàn thiện hương thơm thanh lịch đặc trưng của ZENTARO Origin. Vị thô đi kèm trong quá trình này được loại bỏ có chọn lọc qua lọc lạnh và xử lý than hoạt tính. Giữ trọn hương thơm, chỉ loại bỏ khuyết điểm — đó là triết lý của ZENTARO Origin.\n\nZENTARO Origin không ủ trong thùng sồi. Thay vào đó, rượu được để lắng đủ lâu trong bồn thép không gỉ để ổn định, giữ nguyên hương thơm đã hoàn thiện qua hai lần chưng cất và lọc tinh xảo. Thứ mà thời gian tạo ra ở đây không phải là hương gỗ, mà là hương vị nguyên bản được tạo nên từ gạo, lên men và kỹ thuật chưng cất.\n\nZENTARO Origin không phải soju sản xuất đại trà. Chúng tôi chỉ sản xuất tối đa 100.000 chai (khoảng 35.000 lít) mỗi năm — một phần hạn chế trong tổng năng lực sản xuất của Nhà máy PHUC LOC. Không phải vì không thể sản xuất nhiều hơn, mà vì chúng tôi chọn không làm nhiều hơn, để giữ chất lượng. Từng lát cắt chưng cất, từng lần lọc đều được nghệ nhân kiểm tra bằng tay, nên sản lượng khó có thể tăng dễ dàng.\n\nHương đầu tiên mở ra với hương ester thoảng nhẹ gợi nhớ lê chín và táo xanh, tiếp nối là hương gạo sạch, chút thảo mộc thoảng nhẹ từ sả, hạt ngò và cam thảo, cùng kết cấu mềm mại hòa quyện. Không hương liệu nhân tạo, không phẩm màu, không chất tạo ngọt. Gạo, nước, men Khúc Đen, men rượu, một chút thảo mộc tự nhiên, và hai lần chưng cất qua tĩnh đồng. Đó là tất cả những gì làm nên ZENTARO Origin.",
        },
        features: {
            ko: [
                "세계 최고쌀 'ST25' 100% 사용 (2019 World Rice Conference 선정)",
                "흑국균(Black Koji) 당화로 잡균 억제, 깨끗한 발효",
                "레몬그라스·고수씨·감초 등 극소량의 천연 허브로 은은한 향 악센트",
                "구리 단식 증류기 2회 증류 + 정밀 하트컷(Heart Cut)",
                "오크 숙성 없이 스테인리스 정치만으로 향 보존",
                "연간 10만 병(약 35,000리터) 한정 생산",
                "병뚜껑 인지세 봉인스티커 흔적을 남긴 채 반납·심사 완료 시 10,000 EXP 적립",
            ],
            en: [
                "Uses 100% ST25 rice, named the world's best rice at the 2019 World Rice Conference",
                "Black Koji saccharification suppresses unwanted microbes for a clean fermentation",
                "A whisper-light accent of natural herbs — lemongrass, coriander seed, licorice",
                "Double distilled in a copper pot still with a precise Heart Cut",
                "No oak aging — aroma preserved through stainless steel resting alone",
                "Limited to 100,000 bottles (about 35,000L) per year",
                "Return the cap with its tax-seal sticker trace intact for a 10,000 EXP reward after verification",
            ],
            vi: [
                "Sử dụng 100% gạo ST25 — vinh danh gạo ngon nhất thế giới tại Hội nghị Gạo Thế giới 2019",
                "Đường hóa bằng men Khúc Đen (Black Koji) ức chế vi khuẩn lạ, lên men sạch",
                "Điểm xuyết thảo mộc tự nhiên như sả, hạt ngò, cam thảo",
                "Chưng cất kép qua tĩnh đồng với kỹ thuật Heart Cut chính xác",
                "Không ủ sồi — hương thơm được giữ nguyên chỉ nhờ để lắng trong bồn thép không gỉ",
                "Giới hạn 100.000 chai (khoảng 35.000 lít) mỗi năm",
                "Gửi lại nắp chai còn dấu tem niêm phong thuế để nhận 10.000 EXP sau khi xác minh",
            ],
        },
        ingredients: {
            ko: "ST25 쌀 100%, 흑국균(Black Koji), 효모, 레몬그라스·고수씨·감초 등 극소량의 천연 허브, 정제수",
            en: "ST25 rice 100%, Black Koji, Yeast, a trace of natural herbs (lemongrass, coriander seed, licorice, etc.), Purified water",
            vi: "Gạo ST25 100%, Men Khúc Đen (Black Koji), Men rượu, một chút thảo mộc tự nhiên (sả, hạt ngò, cam thảo...), Nước tinh khiết",
        },
    },
    {
        id: "zentaro-st",
        brand: "zentaro",
        displayName: "ZENTARO STRAWBERRY LIQUEUR",
        comingSoon: true,
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
                "병뚜껑 인지세 봉인스티커 흔적을 남긴 채 반납·심사 완료 시 20,000 EXP 포인트 적립",
            ],
            en: [
                "100% natural strawberry concentrate via low temperature slow maceration",
                "Odorless and tasteless premium base spirit for pure fruit expressiveness",
                "Strict chemical-free manufacturing with no artificial colors or additives",
                "Return the cap with its tax-seal sticker trace intact to claim 20,000 EXP after verification",
            ],
            vi: [
                "Chiết xuất chậm từ 100% trái dâu tây tươi tự nhiên chín mọng",
                "Sử dụng rượu nền lọc tinh khiết không màu không mùi cao cấp",
                "Nói không với phẩm màu nhân tạo và chất bảo quản hoá học",
                "Gửi lại nắp chai còn dấu tem niêm phong thuế để nhận 20.000 EXP sau khi xác minh",
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
        brand: "zentaro",
        displayName: "ZENTARO CRAFT ABSINTHE",
        comingSoon: true,
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
            ko: "예술가들의 영감의 원천이었던 '녹색 요정(Green Fairy)' 압생트를 젠타로의 독창적인 관점으로 재해석한 전통 크래프트 스피릿입니다. 라이스(Rice) 스피릿 기주에 베트남 야생 쑥(Wormwood/Ngải Cứu)과 향긋한 아니스, 펜넬 등의 약초를 정교하게 우려낸 뒤 추가 증류를 거쳐 압생트 특유의 투명한 연록빛 색감과 깊고 복합적인 리코리스 향취를 고스란히 담아냈습니다. 물을 서서히 떨어뜨릴 때 번지는 매혹적인 오팔색 탁화 현상(Louche Effect)을 감상할 수 있습니다.",
            en: "Reimagined through ZenTaro's lens, this 'Green Fairy' craft Absinthe uses wild Vietnamese wormwood (Ngải Cứu) alongside aromatic anise and fennel seed infused into a rich rice spirit base. Followed by meticulous double distillation, it preserves the bright natural pale-green color and deep, complex herbal wormwood finish. Adding iced water drop by drop yields the magical opalescent louche effect.",
            vi: "Tái hiện huyền thoại 'Nàng tiên xanh' (Green Fairy) dưới lăng kính nghệ thuật của ZenTaro. Sự kết hợp giữa ngải cứu hoang dã Tây Bắc (Ngải Cứu), tiểu hồi hương và hương thảo mộc tự nhiên ngâm ủ trong rượu nền. Trải qua chưng cất kép giữ trọn sắc xanh trong veo tự nhiên cùng hiệu ứng vẩn đục (louche) huyền ảo khi thêm nước đá.",
        },
        features: {
            ko: [
                "베트남 북부 야생 천연 쑥(Wormwood) 핵심 침제 기법 적용",
                "인위적인 인공 색소가 전혀 없는 천연 허브 기반의 에메랄드 그린 색조",
                "냉수 희석 시 풍부한 에센셜 오일 방출로 극상의 Louche 탁화 감상 가능",
                "병뚜껑 인지세 봉인스티커 흔적을 남긴 채 반납·심사 통과 시 40,000 EXP 포인트 적립",
            ],
            en: [
                "Wild high-altitude Vietnamese wormwood (Ngải cứu) maceration",
                "Natural emerald hue extracted purely from botanical chlorophyll (zero artificial dye)",
                "Rich essential oils release creating the legendary cloudy louche effect when diluted",
                "Return the cap with its tax-seal sticker trace intact to claim 40,000 EXP after verification",
            ],
            vi: [
                "Ngâm ủ từ lá ngải cứu tự nhiên thu hoạch trên đỉnh núi Hoàng Liên Sơn",
                "Màu xanh ngọc lục bảo tự nhiên chiết xuất từ diệp lục thảo mộc (không màu nhân tạo)",
                "Tinh dầu tự nhiên đậm đặc tạo hiệu ứng vẩn đục sương mù tuyệt đẹp khi pha nước lạnh",
                "Gửi lại nắp chai còn dấu tem niêm phong thuế để nhận 40.000 EXP sau khi xác minh",
            ],
        },
        ingredients: {
            ko: "베트남 야생 쑥(Wormwood), 스타아니스, 펜넬 씨앗, 멜리사, 히솝, 라이스 스피릿 기주",
            en: "Vietnamese wild wormwood, Star anise, Fennel seed, Lemon balm, Hyssop, Rice spirit base",
            vi: "Lá ngải cứu Tây Bắc, đại hồi, tiểu hồi, tía tô đất, thần sa cát, rượu nền tinh khiết",
        },
    },
    {
        id: "zentaro-oak",
        brand: "zentaro",
        displayName: "ZENTARO OAK BARREL",
        comingSoon: true,
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
    // PHÚC LỘC 자체 브랜드 라인업 — ZENTARO를 만드는 바로 그 증류소가 베트남 현지에
    // 자기 이름으로 판매하는 전통 쌀 증류주. 출처: ruouphucloc.vn (2026-08-04 확인).
    {
        id: "phuc-loc-loc-tuu",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — LỘC TỬU",
        comingSoon: false,
        image: "/images/products/phuc-loc/loc-tuu.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/loc-tuu/",
        category: {
            ko: "프리미엄 오크향 소주",
            en: "Premium Oak-Character Rice Spirit",
            vi: "Rượu gạo cao cấp hương gỗ sồi",
        },
        tagline: {
            ko: "호박색으로 빚어낸 PHÚC LỘC의 대표 프리미엄 라인",
            en: "PHÚC LỘC's flagship premium line, poured in amber-gold",
            vi: "Dòng cao cấp đại diện của PHÚC LỘC, sắc hổ phách",
        },
        specs: {
            abv: "29.5%",
            volume: "750ml",
        },
        desc: {
            ko: "PHÚC LỘC 증류소가 전통 증류 기법과 오크 숙성을 결합해 만든 대표 프리미엄 라인입니다. 찹쌀을 기주로 삼아 호박색(Amber-gold)을 띠며, 찹쌀 특유의 향과 은은한 오크나무 향이 함께 느껴집니다. 우아한 향, 깊고 부드러운 맛, 긴 여운을 강조하는 제품으로 세라믹 병에 담겨 선물용으로도 자주 쓰입니다.",
            en: "PHÚC LỘC Distillery's flagship premium line, combining traditional distillation with oak-character aging. Made from sticky rice, it carries an amber-gold hue with notes of sticky rice and gentle oak wood. Positioned around an elegant aroma, deep smooth taste, and a long finish, it's presented in a ceramic bottle often chosen as a gift.",
            vi: "Dòng cao cấp đại diện của Nhà máy Rượu PHÚC LỘC, kết hợp kỹ thuật chưng cất truyền thống với hương gỗ sồi. Chưng cất từ gạo nếp, mang sắc hổ phách cùng hương nếp và hương gỗ sồi thoảng nhẹ. Sản phẩm nhấn mạnh hương thơm thanh lịch, vị đậm đà mềm mại và hậu vị kéo dài, đóng trong chai gốm sang trọng thường được chọn làm quà biếu.",
        },
        features: {
            ko: [
                "찹쌀 기주 + 전통 증류와 오크 숙성의 결합",
                "호박색(Amber-gold) 컬러와 은은한 오크나무 향",
                "우아한 향, 깊고 부드러운 맛, 긴 여운",
                "세라믹 병 패키지 — 선물용으로도 인기",
            ],
            en: [
                "Sticky rice base — traditional distillation combined with oak-character aging",
                "Amber-gold color with a gentle oak wood note",
                "Elegant aroma, deep smooth taste, long finish",
                "Ceramic bottle packaging — a popular gift choice",
            ],
            vi: [
                "Nền gạo nếp — kết hợp chưng cất truyền thống với hương gỗ sồi",
                "Sắc hổ phách cùng hương gỗ sồi thoảng nhẹ",
                "Hương thơm thanh lịch, vị đậm đà mềm mại, hậu vị kéo dài",
                "Đóng chai gốm sang trọng — lựa chọn quà biếu phổ biến",
            ],
        },
        ingredients: {
            ko: "엄선 쌀(찹쌀), 술 누룩, 정제수",
            en: "Selected sticky rice, wine yeast, purified water",
            vi: "Gạo nếp tuyển chọn, men rượu, nước tinh khiết",
        },
    },
    {
        id: "phuc-loc-bach-ngoc-tuu",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — BẠCH NGỌC TỬU",
        comingSoon: false,
        image: "/images/products/phuc-loc/bach-ngoc-tuu.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/bach-ngoc-tuu/",
        category: {
            ko: "화이트 스피릿 소주",
            en: "White Spirit Rice Liquor",
            vi: "Rượu gạo White Spirit",
        },
        tagline: {
            ko: "'백옥(白玉)'이라는 이름처럼 맑고 투명한 프리미엄 쌀 증류주",
            en: "A clear, jewel-like premium rice spirit — true to its name, \"White Jade\"",
            vi: "Trong veo như ngọc trắng, đúng như cái tên \"Bạch Ngọc\"",
        },
        specs: {
            abv: "29.5%",
            volume: "500ml",
        },
        desc: {
            ko: "이름 그대로 백옥(白玉)처럼 맑고 투명한 외관에 은은한 쌀 향을 지닌 프리미엄 쌀 증류주입니다. 찹쌀 원료의 전통 방식과 ISO 인증 현대식 증류 기술을 결합해, 부드럽고 단 여운의 맛을 완성했습니다.",
            en: "True to its name — \"White Jade\" — this premium rice spirit has a clear, transparent appearance and a gentle rice aroma. It blends traditional sticky-rice methods with modern ISO-certified distillation to deliver a smooth, sweet-finishing taste.",
            vi: "Đúng như tên gọi \"Bạch Ngọc\" (ngọc trắng), rượu mang vẻ ngoài trong veo cùng hương gạo thoảng nhẹ. Kết hợp phương pháp truyền thống từ gạo nếp với công nghệ chưng cất hiện đại đạt chuẩn ISO, mang lại vị mềm mại, hậu ngọt.",
        },
        features: {
            ko: [
                "찹쌀 원료의 높은 점성과 풍부한 영양 활용",
                "전통 기법 + ISO 인증 현대식 증류 공정",
                "부드럽고 단 여운이 특징인 맛 프로필",
                "맑고 투명한 외관, 은은한 쌀 향",
            ],
            en: [
                "Uses sticky rice prized for its high viscosity and rich nutrition",
                "Traditional method combined with ISO-certified modern distillation",
                "Smooth, sweet-finishing flavor profile",
                "Clear, transparent appearance with a gentle rice aroma",
            ],
            vi: [
                "Tận dụng độ dẻo cao và giá trị dinh dưỡng của gạo nếp",
                "Phương pháp truyền thống kết hợp chưng cất hiện đại đạt chuẩn ISO",
                "Hương vị đặc trưng mềm mại, hậu ngọt",
                "Vẻ ngoài trong veo, hương gạo thoảng nhẹ",
            ],
        },
        ingredients: {
            ko: "엄선 쌀, 술 누룩, 정제수",
            en: "Selected rice, wine yeast, purified water",
            vi: "Gạo tuyển chọn, men rượu, nước tinh khiết",
        },
    },
    {
        id: "phuc-loc-tinh-que",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — TÌNH QUÊ",
        comingSoon: false,
        image: "/images/products/phuc-loc/tinh-que.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/tinh-que/",
        category: {
            ko: "데일리 전통 쌀 소주",
            en: "Everyday Traditional Rice Spirit",
            vi: "Rượu gạo truyền thống hằng ngày",
        },
        tagline: {
            ko: "36가지 약재 전통 누룩이 빚어낸 고향의 정(情)",
            en: "The warmth of home, brewed with a traditional 36-herb yeast",
            vi: "Tình quê hương chưng cất từ men truyền thống 36 vị thuốc",
        },
        specs: {
            abv: "25%",
            volume: "360ml",
        },
        desc: {
            ko: "맑고 투명한 색에 쌀 향과 상쾌한 노트를 지닌 데일리 전통 쌀 증류주입니다. 엄선한 쌀에 36가지 약재가 들어간 전통 누룩으로 당화하고, ISO 표준 공정으로 생산해 진하면서도 깨끗한 맛에 은은한 단맛을 더했습니다. 이름처럼 고향(quê hương)의 정서를 담은 제품입니다.",
            en: "An everyday traditional rice spirit with a clear, transparent color and a fresh rice aroma. Selected rice is saccharified with a traditional yeast blend of 36 herbal ingredients and produced to ISO standards, giving a full yet clean flavor with a subtle sweetness. As its name suggests, it carries the emotional warmth of one's home village (quê hương).",
            vi: "Rượu gạo truyền thống dùng hằng ngày, màu trong veo cùng hương gạo và nét sảng khoái. Gạo tuyển chọn được đường hóa bằng men gia truyền pha chế từ 36 vị thuốc, sản xuất theo chuẩn ISO, mang lại vị đậm đà mà tinh khiết với hậu ngọt nhẹ. Đúng như tên gọi, sản phẩm gửi gắm tình cảm quê hương.",
        },
        features: {
            ko: [
                "엄선 쌀 + 36가지 약재 전통 누룩 당화",
                "ISO 표준 생산 공정",
                "진하면서도 깨끗한 맛, 은은한 단맛의 여운",
                "맑고 투명한 색, 쌀 향과 상쾌한 노트",
            ],
            en: [
                "Selected rice saccharified with a traditional 36-herb yeast blend",
                "ISO-standard production process",
                "Full yet clean flavor with a gentle sweet finish",
                "Clear, transparent color with rice aroma and fresh notes",
            ],
            vi: [
                "Gạo tuyển chọn đường hóa bằng men gia truyền 36 vị thuốc",
                "Quy trình sản xuất đạt chuẩn ISO",
                "Vị đậm đà mà tinh khiết, hậu ngọt nhẹ",
                "Màu trong veo, hương gạo và nét sảng khoái",
            ],
        },
        ingredients: {
            ko: "엄선 쌀, 전통 쌀누룩(36가지 약재), 정제수",
            en: "Selected rice, traditional rice yeast (36 herbal ingredients), purified water",
            vi: "Gạo tuyển chọn, men gạo truyền thống (36 vị thuốc), nước tinh khiết",
        },
    },
    {
        id: "phuc-loc-song-que",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — SÔNG QUÊ",
        comingSoon: false,
        image: "/images/products/phuc-loc/song-que.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/song-que/",
        category: {
            ko: "데일리 전통 쌀 소주",
            en: "Everyday Traditional Rice Spirit",
            vi: "Rượu gạo truyền thống hằng ngày",
        },
        tagline: {
            ko: "고향 강가의 정취를 담은 순수한 쌀 증류주",
            en: "A pure rice spirit capturing the peace of a home-village river",
            vi: "Hương vị thanh khiết của dòng sông quê hương",
        },
        specs: {
            abv: "23%",
            volume: "360ml",
        },
        desc: {
            ko: "자연 그대로의 투명함과 쌀 향, 상쾌한 노트가 특징인 데일리 쌀 증류주입니다. 엄선 쌀과 36가지 약재가 들어간 전통 누룩을 ISO 인증 공정으로 생산해, 순수한 맛과 은은한 단맛의 여운을 완성했습니다. 이름처럼 고향 강가의 평온한 정취를 표현합니다.",
            en: "An everyday rice spirit defined by natural transparency, rice aroma, and refreshing notes. Selected rice and a traditional yeast blend of 36 herbal ingredients are produced under ISO-certified processes, resulting in a pure flavor with a gentle sweet finish — evoking the calm of a home-village river, as its name suggests.",
            vi: "Rượu gạo hằng ngày với vẻ trong suốt tự nhiên, hương gạo và nét sảng khoái. Gạo tuyển chọn cùng men gia truyền pha chế từ 36 vị thuốc được sản xuất theo quy trình đạt chuẩn ISO, tạo nên hương vị thanh khiết với hậu ngọt nhẹ, gợi nhớ sự bình yên của dòng sông quê hương.",
        },
        features: {
            ko: [
                "엄선 쌀 + 36가지 약재 전통 누룩 배합",
                "ISO 인증 생산 공정",
                "순수한 맛, 은은한 단맛의 여운",
                "자연 그대로의 투명함, 쌀 향과 상쾌함",
            ],
            en: [
                "Selected rice with a traditional 36-herb yeast blend",
                "ISO-certified production process",
                "Pure flavor with a gentle sweet finish",
                "Naturally transparent, with rice aroma and freshness",
            ],
            vi: [
                "Gạo tuyển chọn kết hợp men gia truyền 36 vị thuốc",
                "Quy trình sản xuất đạt chuẩn ISO",
                "Hương vị thanh khiết, hậu ngọt nhẹ",
                "Trong suốt tự nhiên, hương gạo và sự sảng khoái",
            ],
        },
        ingredients: {
            ko: "엄선 쌀, 전통 쌀누룩(36가지 약재), 정제수",
            en: "Selected rice, traditional rice yeast (36 herbal ingredients), purified water",
            vi: "Gạo tuyển chọn, men gạo truyền thống (36 vị thuốc), nước tinh khiết",
        },
    },
    {
        id: "phuc-loc-giot-thoi-gian",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — GIỌT THỜI GIAN",
        comingSoon: false,
        image: "/images/products/phuc-loc/giot-thoi-gian.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/giot-thoi-gian/",
        category: {
            ko: "데일리 전통 쌀 소주",
            en: "Everyday Traditional Rice Spirit",
            vi: "Rượu gạo truyền thống hằng ngày",
        },
        tagline: {
            ko: "'시간의 방울'이라는 이름처럼, 정성이 응축된 한 방울",
            en: "\"A Drop of Time\" — every drop distilled with care",
            vi: "\"Giọt Thời Gian\" — từng giọt chắt lọc tinh hoa",
        },
        specs: {
            abv: "23%",
            volume: "450ml",
        },
        desc: {
            ko: "맑은 색에 쌀 향과 상쾌한 노트를 지닌 데일리 쌀 증류주입니다. 엄선 쌀의 정수와 36가지 약재가 들어간 전통 누룩을 ISO 표준 공정으로 빚어, 진하고 부드러운 향과 깊은 여운의 단맛을 완성했습니다.",
            en: "An everyday rice spirit with a clear color, rice aroma, and fresh notes. The essence of selected rice meets a traditional yeast blend of 36 herbal ingredients, produced under ISO-standard processes for a full, smooth aroma and a deep, lingering sweetness.",
            vi: "Rượu gạo hằng ngày với màu trong, hương gạo và nét sảng khoái. Tinh túy từ gạo tuyển chọn hòa cùng men gia truyền pha chế từ 36 vị thuốc, sản xuất theo chuẩn ISO, mang đến hương thơm nồng nàn êm dịu và hậu ngọt sâu lắng.",
        },
        features: {
            ko: [
                "엄선 쌀의 정수 + 36가지 약재 전통 누룩",
                "ISO 표준 생산 공정",
                "진하고 부드러운 향, 깊은 여운의 단맛",
                "맑은 색, 쌀 향과 상쾌한 노트",
            ],
            en: [
                "Essence of selected rice with a traditional 36-herb yeast blend",
                "ISO-standard production process",
                "Full, smooth aroma with a deep lingering sweetness",
                "Clear color with rice aroma and fresh notes",
            ],
            vi: [
                "Tinh túy gạo tuyển chọn cùng men gia truyền 36 vị thuốc",
                "Quy trình sản xuất đạt chuẩn ISO",
                "Hương thơm nồng nàn êm dịu, hậu ngọt sâu lắng",
                "Màu trong, hương gạo và nét sảng khoái",
            ],
        },
        ingredients: {
            ko: "엄선 쌀, 술 누룩(36가지 약재), 정제수",
            en: "Selected rice, wine yeast (36 herbal ingredients), purified water",
            vi: "Gạo tuyển chọn, men rượu (36 vị thuốc), nước tinh khiết",
        },
    },
    {
        id: "phuc-loc-dan-viet",
        brand: "phuc-loc",
        displayName: "PHÚC LỘC — DÂN VIỆT",
        comingSoon: false,
        image: "/images/products/phuc-loc/dan-viet.webp",
        externalUrl: "https://ruouphucloc.vn/san-pham/dan-viet/",
        category: {
            ko: "대용량 패밀리 소주",
            en: "Large-Format Family Rice Spirit",
            vi: "Rượu gạo dung tích lớn cho gia đình",
        },
        tagline: {
            ko: "베트남 가정의 일상에 맞춘 넉넉한 2리터 용량",
            en: "A generous 2-liter format built for everyday Vietnamese households",
            vi: "Dung tích 2 lít đầy đặn, phù hợp thói quen sinh hoạt của gia đình Việt",
        },
        specs: {
            abv: "22%",
            volume: "2L",
        },
        desc: {
            ko: "맑고 투명하며 쌀 향과 신선함이 느껴지는 대용량 쌀 증류주입니다. 향미 좋은 쌀을 전통과 현대 방식을 결합해 발효, 깨끗하고 풍부한 맛을 구현했습니다. 2리터 PET 용기에 담아 가정용 소비에 적합하도록 설계했습니다.",
            en: "A large-format rice spirit that's clear and transparent, with rice aroma and freshness. Aromatic rice is fermented using a combination of traditional and modern methods to achieve a clean, full-bodied taste. Packaged in a 2-liter PET container designed for everyday household use.",
            vi: "Rượu gạo dung tích lớn, trong suốt, mang hương gạo và sự tươi mới. Gạo thơm được lên men kết hợp phương pháp truyền thống và hiện đại, tạo nên vị sạch, đậm đà. Đóng trong bình PET 2 lít, thiết kế phù hợp cho tiêu dùng gia đình.",
        },
        features: {
            ko: [
                "향미 좋은 쌀을 전통 + 현대 방식으로 발효",
                "깨끗하고 풍부한 맛",
                "2리터 대용량 PET 용기, 식품안전 기준 설계",
                "베트남 가정의 일상 소비에 적합",
            ],
            en: [
                "Aromatic rice fermented with traditional and modern methods combined",
                "Clean, full-bodied taste",
                "2-liter PET container designed to food-safety standards",
                "Suited to everyday Vietnamese household consumption",
            ],
            vi: [
                "Gạo thơm lên men kết hợp phương pháp truyền thống và hiện đại",
                "Vị sạch, đậm đà",
                "Bình PET 2 lít, thiết kế đạt chuẩn an toàn thực phẩm",
                "Phù hợp thói quen tiêu dùng hằng ngày của gia đình Việt",
            ],
        },
        ingredients: {
            ko: "엄선 쌀, 술 누룩, 정제수",
            en: "Selected rice, wine yeast, purified water",
            vi: "Gạo tuyển chọn, men rượu, nước tinh khiết",
        },
    },
]

const ORDERED_PRODUCTS = [...BRAND_PRODUCTS].sort((a, b) => {
    if (a.id === "zentaro-origin") return -1
    if (b.id === "zentaro-origin") return 1
    return 0
})

const ZENTARO_TAB_PRODUCTS = ORDERED_PRODUCTS.filter((p) => p.brand === "zentaro")
const PHUC_LOC_TAB_PRODUCTS = ORDERED_PRODUCTS.filter((p) => p.brand === "phuc-loc")

export default function ProductsPromotionalPage() {
    const { t, locale } = useI18n()
    const [activeTab, setActiveTab] = useState(ORDERED_PRODUCTS[0].id)

    const selectedProduct = BRAND_PRODUCTS.find((p) => p.id === activeTab) || ORDERED_PRODUCTS[0]
    const isComingSoon = selectedProduct.comingSoon ?? false
    const activeBrand = selectedProduct.brand
    const visibleTabProducts = activeBrand === "zentaro" ? ZENTARO_TAB_PRODUCTS : PHUC_LOC_TAB_PRODUCTS

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
                {/* Brand Group Toggle */}
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="inline-flex rounded-full border border-border bg-card p-1">
                        <button
                            onClick={() => setActiveTab(ZENTARO_TAB_PRODUCTS[0].id)}
                            className={`rounded-full px-6 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${activeBrand === "zentaro"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            ZENTARO
                        </button>
                        <button
                            onClick={() => setActiveTab(PHUC_LOC_TAB_PRODUCTS[0].id)}
                            className={`rounded-full px-6 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${activeBrand === "phuc-loc"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            PHÚC LỘC
                        </button>
                    </div>
                    {activeBrand === "phuc-loc" ? (
                        <p className="max-w-xl text-center text-xs text-muted-foreground">
                            {locale === "ko"
                                ? "PHÚC LỘC은 ZENTARO를 만드는 바로 그 증류소가 베트남 현지에 자체 이름으로 선보이는 전통 쌀 증류주 라인업입니다."
                                : locale === "vi"
                                    ? "PHÚC LỘC là dòng sản phẩm rượu gạo truyền thống do chính Nhà máy Rượu tạo nên thương hiệu ZENTARO giới thiệu dưới tên riêng tại thị trường Việt Nam."
                                    : "PHÚC LỘC is the traditional rice spirit lineup sold under its own name in Vietnam by the very same distillery behind ZENTARO."}
                        </p>
                    ) : null}
                </div>

                {/* Navigation Tabs - Glassmorphism style */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {visibleTabProducts.map((prod) => (
                        <button
                            key={prod.id}
                            onClick={() => setActiveTab(prod.id)}
                            className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 border ${activeTab === prod.id
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-card hover:bg-secondary text-muted-foreground border-border hover:text-foreground"
                                }`}
                        >
                            {prod.category[locale]}
                            {prod.comingSoon ? (
                                <span className="ml-1.5 text-[10px] font-normal opacity-70">
                                    ({locale === "ko" ? "준비중" : locale === "vi" ? "Sắp ra mắt" : "Coming soon"})
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Product Showcase Detail Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-card/30 rounded-3xl border border-border/80 p-8 sm:p-12 backdrop-blur-sm">
                    {/* Left Column: Product Image */}
                    <div className="lg:col-span-5 relative -mx-8 -mt-8 sm:mx-auto sm:mt-0 flex justify-center aspect-[4/5] sm:aspect-square sm:w-full sm:max-w-sm overflow-hidden bg-zinc-950/40 rounded-t-3xl sm:rounded-2xl border-0 sm:border sm:border-border/60 shadow-none sm:shadow-2xl p-0 sm:p-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent z-0 pointer-events-none" />
                        {selectedProduct.image ? (
                            <Image
                                src={selectedProduct.image}
                                alt={selectedProduct.category[locale]}
                                fill
                                className="object-contain sm:p-6 transform group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 400px"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center text-zinc-500">No Image</div>
                        )}
                        {selectedProduct.id === "zentaro-origin" ? <AromaParticles /> : null}
                        {isComingSoon ? (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/50 backdrop-blur-[1px]">
                                <Badge className="bg-zinc-900/90 text-white border border-white/20 text-xs px-3 py-1 uppercase tracking-widest font-mono select-none">
                                    {locale === "ko" ? "출시 준비중" : locale === "vi" ? "Sắp ra mắt" : "Coming Soon"}
                                </Badge>
                            </div>
                        ) : null}
                    </div>

                    {/* Right Column: Descriptions & Tech Specs */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                        <div>
                            <Badge variant="outline" className="border-primary/50 text-primary text-xs px-2.5 py-0.5 select-none font-mono">
                                {selectedProduct.category[locale]}
                            </Badge>
                            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                {selectedProduct.displayName}
                            </h2>
                            <p className="mt-3 text-lg font-medium text-amber-500 dark:text-amber-400">
                                &ldquo;{selectedProduct.tagline[locale]}&rdquo;
                            </p>
                        </div>

                        {isComingSoon ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-secondary/20 px-6 py-8 text-center sm:text-left">
                                <Sparkles className="h-8 w-8 shrink-0 text-amber-500" />
                                <div>
                                    <p className="text-lg font-bold text-foreground">
                                        {locale === "ko" ? "출시 준비중입니다" : locale === "vi" ? "Sản phẩm đang được chuẩn bị ra mắt" : "Coming Soon"}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {locale === "ko"
                                            ? "더 완성도 높은 모습으로 곧 찾아뵙겠습니다. 현재는 수제명품 증류식소주 ZENTARO ORIGIN만 만나보실 수 있어요."
                                            : locale === "vi"
                                                ? "Chúng tôi sẽ sớm ra mắt với phiên bản hoàn thiện nhất. Hiện tại chỉ có ZENTARO ORIGIN sẵn sàng phục vụ quý khách."
                                                : "We're putting the finishing touches on this one. For now, ZENTARO ORIGIN is the only product available."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
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
                        <div className="space-y-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {selectedProduct.desc[locale].split("\n\n").map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>

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
                            {selectedProduct.brand === "zentaro" ? (
                                <Button asChild size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Link href="/mall" className="gap-2 justify-center">
                                        {locale === "ko" ? "ZENTARO 몰에서 쇼핑하기" : locale === "vi" ? "Mua sắm tại ZENTARO Mall" : "Shop at ZENTARO Mall"}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : selectedProduct.externalUrl ? (
                                <Button asChild size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                                    <a href={selectedProduct.externalUrl} target="_blank" rel="noopener noreferrer" className="gap-2 justify-center">
                                        {locale === "ko" ? "PHÚC LỘC 공식 사이트에서 보기" : locale === "vi" ? "Xem tại trang chính thức PHÚC LỘC" : "View on the official PHÚC LỘC site"}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </Button>
                            ) : null}
                            {selectedProduct.specs.reward && (
                                <Button asChild variant="outline" size="lg" className="flex-1 border-primary/50 text-primary hover:bg-secondary">
                                    <Link href="/rewards/bottle-cap" className="gap-2 justify-center">
                                        <Award className="h-4 w-4" />
                                        {locale === "ko" ? "병뚜껑 리워드 신청하기" : locale === "vi" ? "Nộp nắp chai nhận thưởng" : "Claim Cap Rewards"}
                                    </Link>
                                </Button>
                            )}
                        </div>
                            </>
                        )}
                    </div>
                </div>

                {selectedProduct.id === "zentaro-origin" ? <BrandTastingNotes locale={locale} /> : null}
                {!isComingSoon ? (
                    <ReviewsSection key={selectedProduct.id} productId={selectedProduct.id} locale={locale} />
                ) : null}

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

const AROMA_PARTICLES = [
    { emoji: "🍏", left: "10%", delay: "0s", duration: "6s", driftX: "10px", size: "text-lg" },
    { emoji: "🌾", left: "20%", delay: "1.2s", duration: "7s", driftX: "-14px", size: "text-base" },
    { emoji: "🍐", left: "32%", delay: "2.4s", duration: "6.5s", driftX: "16px", size: "text-lg" },
    { emoji: "🍏", left: "46%", delay: "0.6s", duration: "7.5s", driftX: "-10px", size: "text-base" },
    { emoji: "🌾", left: "56%", delay: "3s", duration: "6s", driftX: "12px", size: "text-sm" },
    { emoji: "🍐", left: "66%", delay: "1.8s", duration: "7s", driftX: "-16px", size: "text-lg" },
    { emoji: "🍏", left: "76%", delay: "3.6s", duration: "6.8s", driftX: "8px", size: "text-sm" },
    { emoji: "🌾", left: "86%", delay: "2.1s", duration: "7.2s", driftX: "-12px", size: "text-base" },
    { emoji: "🍐", left: "40%", delay: "4.2s", duration: "6.3s", driftX: "18px", size: "text-sm" },
    { emoji: "🌾", left: "14%", delay: "5s", duration: "6.9s", driftX: "-8px", size: "text-lg" },
] as const

function AromaParticles() {
    return (
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            {AROMA_PARTICLES.map((p, idx) => (
                <span
                    key={idx}
                    className={`aroma-particle ${p.size} select-none`}
                    style={
                        {
                            left: p.left,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                            "--aroma-drift-x": p.driftX,
                        } as CSSProperties
                    }
                >
                    {p.emoji}
                </span>
            ))}
        </div>
    )
}

interface TastingNote {
    title: { ko: string; en: string; vi: string }
    body: { ko: string; en: string; vi: string }
    rating: number
}

const ORIGIN_TASTING_NOTES: TastingNote[] = [
    {
        title: { ko: "부드러운 첫인상", en: "A Gentle First Impression", vi: "Ấn tượng đầu mềm mại" },
        body: {
            ko: "첫 잔을 코에 가까이 가져가면 잘 익은 배와 풋사과를 연상시키는 깨끗한 과실향이 먼저 올라온다. 입안에서는 예상보다 훨씬 부드럽고, 알코올 자극보다 향의 층이 먼저 느껴진다. 오크 숙성을 하지 않았다는 사실이 믿기지 않을 정도로 여운이 길다. 증류식 소주의 새로운 가능성을 보여주는 술이다.",
            en: "Bring the first glass close to your nose and a clean fruit aroma reminiscent of ripe pear and green apple rises first. On the palate it's far softer than expected — the layers of aroma register before any alcohol bite. The finish lingers so long it's hard to believe there's no oak aging behind it. A spirit that shows a new direction for distilled soju.",
            vi: "Đưa ly rượu gần mũi, hương trái cây trong trẻo gợi nhớ lê chín và táo xanh dâng lên trước tiên. Trong miệng, rượu mềm mại hơn nhiều so với dự đoán, các tầng hương thơm cảm nhận được trước cả vị cay của cồn. Hậu vị kéo dài đến mức khó tin rằng rượu không hề ủ sồi. Một loại rượu mở ra hướng đi mới cho soju chưng cất.",
        },
        rating: 4.8,
    },
    {
        title: { ko: "깔끔함의 완성", en: "Clean, Perfected", vi: "Sự tinh khiết trọn vẹn" },
        body: {
            ko: "향료나 감미료를 사용하지 않았다는 설명을 듣고 마셔보니 왜 그런 자신감이 있었는지 이해된다. 인위적인 단맛 없이 쌀에서 오는 깨끗한 질감과 에스테르 향이 자연스럽게 이어진다. 깔끔한 피니시 덕분에 음식과 함께 마셔도 부담이 없다.",
            en: "Knowing it contains no added flavoring or sweeteners before tasting it, I understand where that confidence comes from. Without any artificial sweetness, the clean texture from the rice and the ester aroma flow together naturally. Thanks to the clean finish, it never feels heavy when paired with food.",
            vi: "Biết trước rượu không dùng hương liệu hay chất tạo ngọt, khi nếm thử mới hiểu vì sao lại tự tin đến vậy. Không có vị ngọt nhân tạo, kết cấu sạch từ gạo và hương ester hòa quyện tự nhiên. Nhờ hậu vị sạch, uống cùng món ăn cũng không hề nặng nề.",
        },
        rating: 4.7,
    },
    {
        title: { ko: "쌀이 만든 향", en: "An Aroma Made by Rice", vi: "Hương thơm từ gạo" },
        body: {
            ko: "증류식 소주에서 이렇게 풍부한 과실향을 느껴본 것은 처음이다. 배와 청사과 향이 은은하게 이어지고 뒤에서는 흰 꽃 같은 향도 살짝 느껴진다. 오크향 대신 원료 본연의 향이 살아 있다는 점이 가장 큰 매력이다.",
            en: "This is the first time I've tasted such a rich fruit aroma in a distilled soju. Notes of pear and green apple carry through gently, with a faint white-flower character behind them. What I love most is that the raw ingredient's own aroma comes through instead of oak.",
            vi: "Đây là lần đầu tiên tôi cảm nhận được hương trái cây phong phú đến vậy trong một loại soju chưng cất. Hương lê và táo xanh thoảng nhẹ nối tiếp nhau, phía sau còn thoáng chút hương hoa trắng. Điểm hấp dẫn nhất là hương thơm nguyên bản của nguyên liệu được giữ lại thay vì hương gỗ sồi.",
        },
        rating: 4.9,
    },
    {
        title: { ko: "위스키와 다른 매력", en: "A Different Charm from Whisky", vi: "Nét quyến rũ khác biệt so với whisky" },
        body: {
            ko: "위스키처럼 바닐라와 오크 향을 기대한다면 전혀 다른 술이다. 대신 훨씬 깨끗하고 산뜻한 향을 즐길 수 있다. 두 번의 증류가 만들어낸 부드러운 질감과 긴 여운은 가격 이상의 만족감을 준다.",
            en: "If you're expecting vanilla and oak like a whisky, this is a completely different spirit. Instead, you get a far cleaner, crisper aroma. The smooth texture and long finish created by two distillations deliver satisfaction well beyond the price.",
            vi: "Nếu mong đợi hương vani và gỗ sồi như whisky, đây là một loại rượu hoàn toàn khác. Thay vào đó là hương thơm trong trẻo, sảng khoái hơn nhiều. Kết cấu mềm mại và hậu vị dài do hai lần chưng cất tạo ra mang lại sự hài lòng vượt xa mức giá.",
        },
        rating: 4.6,
    },
    {
        title: { ko: "식사와 가장 잘 어울리는 증류주", en: "The Spirit That Pairs Best with a Meal", vi: "Rượu chưng cất hợp với bữa ăn nhất" },
        body: {
            ko: "회, 해산물, 구운 고기와 함께 마셔봤다. 향이 강하지만 음식의 맛을 덮지 않고 오히려 감칠맛을 살려준다. 소주처럼 편하게 마실 수 있으면서도 향은 훨씬 풍부하다. 데일리 프리미엄 증류주라는 표현이 잘 어울린다.",
            en: "I tried it with sashimi, seafood, and grilled meat. The aroma is strong but never covers the food's flavor — if anything, it brings out the umami. It drinks as easily as regular soju, yet the aroma is far richer. 'Everyday premium spirit' is exactly the right description.",
            vi: "Tôi đã uống cùng sashimi, hải sản và thịt nướng. Hương thơm mạnh nhưng không át đi vị của món ăn, ngược lại còn làm nổi bật vị umami. Uống dễ chịu như soju thông thường nhưng hương thơm phong phú hơn nhiều. Cụm từ 'rượu chưng cất cao cấp hằng ngày' quả thực rất hợp.",
        },
        rating: 4.8,
    },
    {
        title: { ko: "향을 위한 두 번의 증류", en: "Two Distillations for the Aroma", vi: "Hai lần chưng cất vì hương thơm" },
        body: {
            ko: "첫 모금에서는 은은한 배 향, 이어서 풋사과의 상쾌함이 느껴진다. 시간이 지나면서 쌀의 고소한 느낌도 살아난다. 거친 알코올 자극이 거의 없어 도수가 믿기지 않을 정도로 마시기 편하다.",
            en: "The first sip brings a gentle pear aroma, followed by the crispness of green apple. As it opens up, the nutty character of rice comes through too. There's almost no harsh alcohol bite, making it dangerously easy to drink for its ABV.",
            vi: "Ngụm đầu tiên mang đến hương lê thoảng nhẹ, tiếp theo là sự sảng khoái của táo xanh. Khi rượu 'mở', vị béo bùi của gạo cũng hiện ra. Gần như không có vị cay gắt của cồn, dễ uống đến mức khó tin so với nồng độ.",
        },
        rating: 4.9,
    },
    {
        title: { ko: "숙성하지 않은 깊이", en: "Depth Without Aging", vi: "Chiều sâu không cần ủ" },
        body: {
            ko: "오크통에서 몇 년을 보내지 않았음에도 향의 깊이가 상당하다. 숙성으로 복잡함을 만드는 대신, 증류 기술로 향을 끌어낸 술이라는 설명이 그대로 이해된다. 기술이 만든 향이라는 표현이 가장 잘 어울린다.",
            en: "Even without years spent in an oak barrel, the aroma has real depth. It's easy to understand the claim that this spirit draws out its aroma through distillation skill rather than the complexity of aging. 'Aroma made by craft' fits it best.",
            vi: "Dù không trải qua nhiều năm trong thùng sồi, chiều sâu hương thơm vẫn rất đáng kể. Có thể hiểu ngay lời giải thích rằng thay vì tạo độ phức tạp qua thời gian ủ, rượu này khai thác hương thơm bằng kỹ thuật chưng cất. Cụm từ 'hương thơm do kỹ thuật tạo nên' là hợp nhất.",
        },
        rating: 4.7,
    },
    {
        title: { ko: "장인의 손길이 느껴지는 술", en: "A Spirit with a Craftsman's Touch", vi: "Rượu mang dấu ấn bàn tay nghệ nhân" },
        body: {
            ko: "연간 생산량이 제한된 이유를 마셔보면 알 수 있다. 컷을 세심하게 가져간 흔적이 느껴지고, 끝맛까지 매우 정돈되어 있다. 대량생산 소주에서는 찾기 어려운 섬세함이 인상적이다.",
            en: "Taste it once and you understand why the annual production is limited. You can feel the care taken in the cut, and even the very last note stays composed. A delicacy that's hard to find in mass-produced soju.",
            vi: "Chỉ cần nếm thử là hiểu vì sao sản lượng hàng năm bị giới hạn. Có thể cảm nhận được sự tỉ mỉ trong từng lát cắt, hậu vị đến cuối vẫn rất gọn gàng. Sự tinh tế khó tìm thấy ở soju sản xuất đại trà để lại ấn tượng sâu sắc.",
        },
        rating: 4.8,
    },
    {
        title: { ko: "향으로 기억되는 소주", en: "A Soju Remembered by Its Aroma", vi: "Soju được nhớ đến qua hương thơm" },
        body: {
            ko: "첫 향이 강렬하기보다 깨끗하고 우아하다. 잔을 비운 뒤에도 과실향이 오래 남아 다음 잔을 자연스럽게 찾게 만든다. '증류식 소주도 이렇게 향이 풍부할 수 있구나'라는 생각이 들었다.",
            en: "The first aroma is elegant and clean rather than intense. Even after the glass is empty, the fruit aroma lingers long enough to make you reach for the next pour naturally. It made me realize distilled soju really can be this aromatic.",
            vi: "Hương đầu tiên thanh lịch, trong trẻo hơn là mạnh mẽ. Ngay cả khi cạn ly, hương trái cây vẫn lưu lại lâu, khiến người ta tự nhiên muốn rót thêm ly nữa. Tôi nhận ra rằng soju chưng cất cũng có thể thơm phong phú đến vậy.",
        },
        rating: 4.9,
    },
    {
        title: { ko: "새로운 프리미엄 증류식 소주", en: "A New Premium Distilled Soju", vi: "Chuẩn mực mới cho soju chưng cất cao cấp" },
        body: {
            ko: "위스키를 대신하려는 술이 아니라, 증류식 소주의 새로운 기준을 제시하는 제품이다. 쌀, 물, 코지, 효모만으로 이 정도의 향과 부드러움을 구현했다는 점이 놀랍다. 가격까지 고려하면 매우 경쟁력 있는 프리미엄 증류주라고 평가하고 싶다.",
            en: "This isn't trying to replace whisky — it sets a new standard for distilled soju. It's remarkable that rice, water, koji, and yeast alone achieve this level of aroma and smoothness. Factoring in the price, I'd call it a highly competitive premium spirit.",
            vi: "Đây không phải loại rượu muốn thay thế whisky, mà là sản phẩm đặt ra chuẩn mực mới cho soju chưng cất. Thật đáng kinh ngạc khi chỉ từ gạo, nước, men koji và men rượu mà tạo nên hương thơm và độ mềm mại đến vậy. Xét cả về giá, tôi đánh giá đây là loại rượu chưng cất cao cấp rất cạnh tranh.",
        },
        rating: 4.8,
    },
]

function BrandTastingNotes({ locale }: { locale: Locale }) {
    const title =
        locale === "ko" ? "ZENTARO 공식 테이스팅 노트" : locale === "vi" ? "Ghi chú thử rượu chính thức từ ZENTARO" : "Official ZENTARO Tasting Notes"
    const subtitle =
        locale === "ko"
            ? "ZENTARO 테이스팅팀이 남긴 공식 시음 코멘트입니다. 아래 실제 회원 후기와는 별도로 제공됩니다."
            : locale === "vi"
                ? "Đây là nhận xét thử rượu chính thức từ đội ngũ nếm thử ZENTARO, được hiển thị riêng biệt với đánh giá thực tế của thành viên bên dưới."
                : "Official tasting comments from the ZENTARO tasting team, shown separately from the genuine member reviews below."

    return (
        <div className="mt-16 rounded-3xl border border-amber-500/20 bg-card/30 p-8 backdrop-blur-sm sm:p-12">
            <div>
                <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-mono select-none">
                    {locale === "ko" ? "브랜드 테이스팅 노트" : locale === "vi" ? "Ghi chú thương hiệu" : "Brand Tasting Notes"}
                </Badge>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ORIGIN_TASTING_NOTES.map((note, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">{note.title[locale]}</span>
                            <div className="flex items-center gap-1.5">
                                <StarRating value={note.rating} />
                                <span className="text-xs text-muted-foreground">{note.rating.toFixed(1)}</span>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{note.body[locale]}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StarRating({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
                />
            ))}
        </div>
    )
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
                    <Star className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                </button>
            ))}
        </div>
    )
}

function formatReviewDate(review: ProductReview) {
    const seconds = review.createdAt?._seconds
    if (!seconds) return ""
    return new Date(seconds * 1000).toLocaleDateString()
}

function maskEmail(email: string) {
    const [name, domain] = email.split("@")
    if (!domain) return email
    const visible = name.slice(0, 2)
    return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`
}

function ReviewsSection({ productId, locale }: { productId: string; locale: Locale }) {
    const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))
    const [uid, setUid] = useState<string | null>(null)
    const [reviews, setReviews] = useState<ProductReview[] | null>(null)
    const [average, setAverage] = useState(0)
    const [count, setCount] = useState(0)
    const [myRating, setMyRating] = useState(5)
    const [myComment, setMyComment] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => onAuthChanged(() => setLoggedIn(Boolean(getToken()))), [])

    useEffect(() => {
        if (!loggedIn) {
            setUid(null)
            return
        }
        fetchMe()
            .then((me) => setUid(me.uid))
            .catch(() => setUid(null))
    }, [loggedIn])

    function load() {
        fetchProductReviews(productId)
            .then((res) => {
                setReviews(res.reviews)
                setAverage(res.average)
                setCount(res.count)
                const mine = res.reviews.find((r) => r.userId === uid)
                if (mine) {
                    setMyRating(mine.rating)
                    setMyComment(mine.comment)
                }
            })
            .catch(() => {
                setReviews([])
                setAverage(0)
                setCount(0)
            })
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, uid])

    const myReview = reviews?.find((r) => r.userId === uid) ?? null

    async function handleSubmit() {
        if (!myComment.trim()) return
        setBusy(true)
        setError(null)
        try {
            await submitProductReview(productId, myRating, myComment.trim())
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit review.")
        } finally {
            setBusy(false)
        }
    }

    async function handleDelete() {
        if (!myReview) return
        setBusy(true)
        setError(null)
        try {
            await deleteProductReview(myReview.id)
            setMyRating(5)
            setMyComment("")
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete review.")
        } finally {
            setBusy(false)
        }
    }

    const title = locale === "ko" ? "시음 후기" : locale === "vi" ? "Đánh giá thử rượu" : "Tasting Reviews"
    const writePrompt =
        locale === "ko" ? "시음 후기 남기기" : locale === "vi" ? "Viết đánh giá của bạn" : "Write your tasting review"
    const placeholder =
        locale === "ko"
            ? "향, 맛, 목넘김 등 시음 느낌을 자유롭게 남겨주세요."
            : locale === "vi"
                ? "Chia sẻ cảm nhận về hương, vị, hậu vị..."
                : "Share your impressions of the aroma, taste, and finish."
    const submitLabel = myReview
        ? locale === "ko"
            ? "후기 수정"
            : locale === "vi"
                ? "Cập nhật đánh giá"
                : "Update Review"
        : locale === "ko"
            ? "후기 등록"
            : locale === "vi"
                ? "Gửi đánh giá"
                : "Submit Review"
    const loginPrompt =
        locale === "ko"
            ? "로그인하면 시음 후기와 평점을 남길 수 있습니다."
            : locale === "vi"
                ? "Đăng nhập để viết đánh giá và chấm điểm."
                : "Log in to write a tasting review and rating."
    const noReviews =
        locale === "ko" ? "아직 등록된 시음 후기가 없습니다." : locale === "vi" ? "Chưa có đánh giá nào." : "No reviews yet."

    return (
        <div className="mt-16 rounded-3xl border border-border/80 bg-card/30 p-8 backdrop-blur-sm sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                {count > 0 ? (
                    <div className="flex items-center gap-2">
                        <StarRating value={average} size="h-5 w-5" />
                        <span className="text-sm font-semibold text-foreground">{average.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({count})</span>
                    </div>
                ) : null}
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-5">
                <span className="text-sm font-semibold text-foreground">{writePrompt}</span>
                {loggedIn ? (
                    <div className="mt-3 flex flex-col gap-3">
                        <StarPicker value={myRating} onChange={setMyRating} />
                        <textarea
                            value={myComment}
                            onChange={(e) => setMyComment(e.target.value)}
                            placeholder={placeholder}
                            maxLength={500}
                            rows={3}
                            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                        />
                        {error ? <p className="text-xs text-destructive">{error}</p> : null}
                        <div className="flex gap-2">
                            <Button size="sm" disabled={busy || !myComment.trim()} onClick={handleSubmit}>
                                {submitLabel}
                            </Button>
                            {myReview ? (
                                <Button size="sm" variant="ghost" disabled={busy} onClick={handleDelete} className="gap-1.5 text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {locale === "ko" ? "삭제" : locale === "vi" ? "Xóa" : "Delete"}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{loginPrompt}</p>
                )}
            </div>

            <div className="mt-6 flex flex-col gap-4">
                {reviews === null ? null : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{noReviews}</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <StarRating value={review.rating} />
                                    <span className="text-xs font-medium text-foreground">{maskEmail(review.email)}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatReviewDate(review)}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
