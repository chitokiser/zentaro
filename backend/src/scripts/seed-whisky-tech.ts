import { config } from 'dotenv';
config();

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../common/collections';

const WHISKY_TECH_POSTS = [
    {
        titleKo: "위스키 재테크의 기초: 마실 수도 있고 팔 수도 있는 황금 자산",
        titleEn: "Whisky Investment Basics: A Liquid Gold Asset You Can Drink or Sell",
        titleVi: "Đầu tư Whisky cơ bản: Tài sản vàng lỏng có thể uống hoặc bán",
        contentKo: `<h3>위스키가 대체 자산으로 사랑받게 된 역사적 배경</h3><p>최근 전통 자산 시장의 변동성이 증가함에 따라 미술품, 시계와 더불어 스피릿(증류주) 계열, 특히 싱글 몰트 위스키가 대체 자산으로 크게 각광받고 있습니다. 영국의 나이트 프랭크(Knight Frank) 사치품 투자 지수(KFLII)에 따르면 위스키는 지난 10년간 약 300% 이상의 누적 수익률을 보이며 자산적 가치를 입증했습니다.</p><p>위스키의 가치가 상승하는 가장 기본적인 잣대는 '시간의 희소성'과 '비가역적 소비성'에 있습니다. 모든 싱글 몰트는 매년 숙성 과정에서 통 속 액체의 약 2%가 공기 중으로 기화하는 '천사의 몫(Angel's Share)'을 겪습니다. 시간이 지날수록 전 세계에 남아있는 원주의 총량은 자연적으로 줄어들며, 일부가 개봉되어 소비될 때마다 미개봉 병의 소장 가치는 기하급수적으로 복리 성장하게 됩니다.</p>`,
        contentEn: `<h3>The Historical Context of Whisky as an Alternative Asset Class</h3><p>In recent years, as traditional financial markets shift, single malt whiskies alongside art and timepieces have captured global attention as resilient alternative assets. According to Knight Frank Luxury Investment Index (KFLII), rare whisky has grown over 300% in value over the past decade, outpacing many indices.</p><p>The economic value of whisky hinges on two parameters: 'temporally bounded scarcity' and 'non-reversible consumption.' Every single malt experiences the 'Angel's Share' where roughly 2% of the volume evaporates annually from the oak cask. As time progresses, the global pool of matured casks shrinks, and each time a rare bottle is opened, the value of the surviving unopened stock compounds.</p>`,
        contentVi: `<h3>Bối cảnh lịch sử của Whisky như một loại tài sản thay thế</h3><p>Trong những năm gần đây, thị trường tài chính truyền thống biến động đã thúc đẩy đầu tư vào các tài sản thay thế như tranh vẽ, đồng hồ và đặc biệt là dòng rượu Single Malt Whisky cao cấp. Theo chỉ số đầu tư xa xỉ Knight Frank (KFLII), giá trị của whisky hiếm đã tăng hơn 300% trong thập kỷ qua.</p><p>Giá trị kinh tế của whisky dựa trên hai yếu tố chính: 'sự khan hiếm theo thời gian' và 'tiêu dùng không thể thu hồi'. Mỗi năm, khoảng 2% lượng rượu trong thùng gỗ sồi bay hơi tự nhiên (Angel's Share). Khi thời gian trôi qua, lượng rượu ủ già ngày càng giảm, và mỗi khi một chai rượu hiếm được mở ra, giá trị của các chai chưa khui còn lại sẽ tăng lên.</p>`,
        daysOffset: 0
    },
    {
        titleKo: "초보자가 오르는 위스키를 고르는 3가지 기준",
        titleEn: "3 Criteria for Choosing Whisky That Appreciates in Value",
        titleVi: "3 tiêu chuẩn lựa chọn Whisky sinh lời cho người mới",
        contentKo: `<h3>첫째, 증류소의 대중적 인지도와 명성 (Distillery Prestige)</h3><p>자산 가치를 유지하기 위해서는 활발한 2차 시장 거래가 필수적입니다. 맥캘란(Macallan), 발베니(Balvenie), 라가불린(Lagavulin) 등 글로벌 자산 거래 규모 상위를 차지하는 상징적인 브랜드 위주로 포트폴리오를 구성해야 가격 하락 방어력이 높습니다.</p><h3>둘째, 빈티지(Vintage) 및 한정판 여부</h3><p>일반적인 정규 라인업(OB)보다는 특정 연도에 증류된 원액으로 소량 생산한 싱글 캐스크(Single Cask)나 캐스크 스트렝스(Cask Strength) 병들이 독점성을 지닙니다. 생산 개수가 병마다 번호(Numbered Bottle)로 표시되어 있다면 소장 가치는 배가됩니다.</p><h3>셋째, 폐쇄된 증류소의 독립 병입 (Ghost Distillery)</h3><p>포트 앨런(Port Ellen), 가루이자와(Karuizawa)처럼 더 이상 원주를 생산하지 않고 역사 속으로 사라진 '유령 증류소'의 보틀은 한정된 총량이 줄어들기만 하므로 초고수익을 가져다주는 주요 타겟입니다.</p>`,
        contentEn: `<h3>First: Distillery Prestige and Mass Market Recognition</h3><p>Maintaining asset value requires active secondary market trading. Iconic distilleries like Macallan, Balvenie, and Lagavulin form the defensive core of a successful portfolio due to high global demand and structural price floors.</p><h3>Second: Vintage Specificity and Limited Runs</h3><p>Rather than official standard bottlings (OB), single casks or cask strength variants distilled in specific years represent ultimate exclusivity. Numbered bottles showing total release prints add a multiplier to collectability.</p><h3>Third: Ghost Distilleries (Closed Sites)</h3><p>Bottlings from closed distilleries like Port Ellen or Karuizawa, where production has completely ceased, command premium valuations because the fixed global supply only decreases over time.</p>`,
        contentVi: `<h3>Thứ nhất: Uy tín và phân khúc nhận diện Thương hiệu</h3><p>Để đảm bảo thanh khoản, danh mục đầu tư cần tập trung vào các nhà chưng cất nổi tiếng như Macallan, Balvenie, Lagavulin - những cái tên luôn dẫn đầu doanh số giao dịch thứ cấp toàn cầu.</p><h3>Thứ hai: Niên vụ (Vintage) và phiên bản giới hạn</h3><p>Các chai Single Cask hoặc Cask Strength được chưng cất riêng biệt theo năm sở hữu tính độc quyền cao hơn dòng phổ thông. Những sản phẩm có đánh số thứ tự chai (Numbered Bottle) sẽ tăng giá trị sưu tầm vượt trội.</p><h3>Thứ ba: Các nhà chưng cất đã đóng cửa (Ghost Distillery)</h3><p>Rượu quý từ các nhà chưng cất huyền thoại ngưng hoạt động như Port Ellen hay Karuizawa luôn có mức giá tăng phi mã do nguồn cung cố định chỉ có giảm theo thời gian.</p>`,
        daysOffset: 1
    },
    {
        titleKo: "포트폴리오의 꽃: 병 위스키와 원주 배럴(Cask) 투자의 핵심 차이점",
        titleEn: "Asset Class Breakdown: Bottle vs. Oak Cask (Barrel) Investment",
        titleVi: "Trọng tâm đầu tư: Khác biệt giữa mua chai Whisky hay mua thùng gỗ sồi (Cask)",
        contentKo: `<h3>소유 형태의 차이: 규격화된 상품 vs 살아숨쉬는 숙성 자산</h3><p>병으로 구매한 위스키는 유리병 밀봉으로 인해 화학적 숙성이 정지됩니다. 가치의 흐름은 순전히 희소성에 의존합니다. 반면, 캐스크(오크통) 투자는 100L에서 500L에 달하는 살아있는 참나무 배럴 자체를 매입하여 젠타로 캐스크 리저브 셀러와 같은 마이크로 클라이밋(Micro-climate) 공간에서 시간을 두고 2차 에이징을 진행하는 것입니다.</p><h3>등급과 숙성 지속성의 레버리지 효과</h3><p>캐스크 상태의 원주는 시간이 지남에 따라 에스테르의 농도가 깊어지며 12년 숙성에서 18년, 21년 숙성으로 등급 자체가 상향 조정됩니다. 해마다 가해지는 시간의 깊이가 현물 가치의 복리 상승을 이끌어내므로, 단순 병 소장 방식보다 유동적이고 묵직한 이윤 구조를 제공합니다.</p>`,
        contentEn: `<h3>Ownership Types: Standard Bottling vs. Living Maturing Casks</h3><p>Once whisky is bottled in glass, its chemical maturation stops cold. Price growth depends entirely on supply-demand trends. Conversely, Cask (Cask/Barrel) investment involves acquiring whole oak barrels ranging from 100L to 500L to undergo secondary maturation in controlled micro-climates like ZenTaro Cask Reserve Cellars.</p><h3>maturation and Asset Class Upgrades</h3><p>Liquid inside aging casks grows more complex over time, automatically upgrading the category classification from 12-year to 18-year or 21-year reserves. This organic compounding yields higher leverage compared to static bottle collecting.</p>`,
        contentVi: `<h3>Hình thức sở hữu: Chai đóng sẵn vs Thùng ủ đang chín</h3><p>Khi rượu đóng vào chai thủy tinh, quá trình biến đổi hóa học sẽ dừng lại hoàn toàn. Sự tăng giá phụ thuộc vào cung cầu thị trường. Ngược lại, đầu tư thùng sồi (Cask/Barrel) là sở hữu các thùng đang ủ từ 100L đến 500L tại các hầm rượu tiêu chuẩn như hầm ZenTaro Cask Reserve.</p><h3>Nâng cấp hạng rượu theo thời gian</h3><p>Chất lỏng trong thùng tự động tăng hương tuổi theo năm, tự động nâng cấp giá trị từ 12 năm lên 18 năm hoặc 21 năm. Điều này giúp tài sản của bạn tự động gia tăng giá trị nội tại hơn so với việc tích trữ chai.</p>`,
        daysOffset: 2
    },
    {
        titleKo: "글로벌 옥션 트렌드 분석: 소더비와 크리스티가 입증한 위스키 가치",
        titleEn: "Global Auction Analysis: How Sotheby's and Christie's Validate Spirits",
        titleVi: "Phân tích đấu giá: Sotheby's và Christie's chứng minh giá trị của Whisky",
        contentKo: `<h3>소더비 경매 최고가 경신 사례와 시장 분석</h3><p>2019년 런던 소더비 경매에서 맥캘란 1926(Fine and Rare 60 Year Old) 한 병이 무려 190만 달러(약 25억 원)에 낙찰되며 전 세상을 놀라게 했습니다. 이 기록이 증명하는 것은 희귀 위스키가 우량 금(Gold) 자산 이상의 안전하면서도 폭발적인 인플레이션 헤지 수단으로 격상되었다는 사실입니다.</p><h3>아시아 시장 주도의 경매 다변화 트렌드</h3><p>최근에는 홍콩과 싱가포르를 허브로 한 아시아 신흥 자산가 집단이 위스키 경매의 주축으로 등장했습니다. 일본의 전설적인 '가루이자와' 증류소 매입 경쟁과 스코틀랜드 프리미엄 독립 캐스크 세그먼트 낙찰가가 해마다 신고가를 갈아치우며 자산의 글로벌 유동성이 확장되고 있습니다.</p>`,
        contentEn: `<h3>Sotheby's Record-Breaking Bids and Market Expansion</h3><p>In 2019, a single bottle of Macallan 1926 (Fine and Rare 60 Year Old) fetched a staggering $1.9 million at Sotheby's London. This historic block-sale confirmed that rare luxury whisky has officially become a premium hedge against inflation, behaving similarly to sovereign gold assets.</p><h3>Asia-Pacific Wealth Inflow and Regional Hubs</h3><p>High-net-worth investors across Hong Kong, Singapore, and South Korea have entered the luxury spirits bidding spaces. Intense demand for Japanese rarities like Karuizawa and bespoke Scotch casks keeps setting new historic highs year over year.</p>`,
        contentVi: `<h3>Kỷ lục gõ búa tại Sotheby's và tầm nhìn vĩ mô</h3><p>Năm 2019, một chai Macallan 1926 phiên bản Fine and Rare 60 năm được bán đấu giá thành công tại Sotheby's London với giá kỷ lục 1,9 triệu USD. Mức giá này chứng minh rượu mạnh quý hiếm đã chính thức được chọn làm tài sản trú ẩn lạm phát an toàn không thua kém vàng ròng.</p><h3>Sức hút mạnh mẽ từ giới tài phiệt Châu Á</h3><p>Các nhà đầu tư từ Hồng Kông, Singapore và Hàn Quốc đang trở thành động lực tăng trưởng lớn nhất ở các phiên đấu giá. Sự săn đón các dòng Karuizawa Nhật Bản và thùng sồi Scotland cao cấp liên tục thiết lập các đỉnh giá lịch sử mới.</p>`,
        daysOffset: 3
    },
    {
        titleKo: "자산의 온전한 보존: 위스키 최적 보관법과 엔젤스 쉐어 통제",
        titleEn: "Asset Protection: Preserving Value and Controlling Angel's Share",
        titleVi: "Bảo tồn giá trị: Cách lưu trữ Whisky tối ưu và kiểm soát độ bay hơi rượu",
        contentKo: `<h3>수직 보관과 파라필름 테이핑의 필수성</h3><p>와인과 달리 고도수의 위스키는 코르크 마개를 눕혀놓을 경우 화학 결합을 일으켜 코르크가 서서히 녹아내려 원주를 변질시킵니다. 따라서 항상 수직(Vertical) 보관이 필수입니다. 또한, 마이크로 기화를 막기 위해 입구를 실링하는 파라필름(Parafilm) 처리를 해 두는 것이 가치 하락을 효과적으로 방어하는 비결입니다.</p><h3>항온항습 셀러와 오크통 피토케미컬 케어</h3><p>캐스크 투자의 경우, 대기 중 증발율인 '엔젤스 쉐어(Angel's Share)'를 2% 미만으로 엄격하게 통제할 수 있는 시스템 셀러에 맡겨야 합니다. 하노이 젠타로 위스키 리서치 셀러 환경처럼 적절한 바닷바람이나 인근 고산지대 특유의 한랭 건조 온도를 제어해 주면 오크통 목재 셀룰로오스가 황금빛 바닐라 결정을 방출하며 자산의 완성도를 높입니다.</p>`,
        contentEn: `<h3>The Importance of Vertical Storage and Parafilm Sealing</h3><p>Unlike wine, high-ABV spirits will degrade natural cork joints if kept horizontally, causing leaks and cork rot. Unopened vertical storage is mandatory. Additionally, wrapping closures with Parafilm ensures no trace levels of evaporation reduce liquid heights over years.</p><h3>Temperature Control and Oak Cask Phytochemical Stability</h3><p>Cask collectors must secure storage within humidity-controlled vaults to hold annual evaporation (Angel's Share) below 2%. Climate parameters like those at ZenTaro Aging Vaults allow wood oak pores to release premium vanillin profiles and rich complex tannins steadily.</p>`,
        contentVi: `<h3>Tầm quan trọng của dựng đứng chai và bọc sáp niêm phong</h3><p>Khác với vang, rượu mạnh nồng độ cao xếp nằm ngang sẽ ăn mòn nút bần, gây rò rỉ. Phải lưu trữ đứng 100%. Ngoài ra, bọc màng Parafilm quanh cổ chai là bí quyết để ngăn chặn sự bay hơi dù là nhỏ nhất theo năm tháng.</p><h3>Hầm giữ ẩm chuyên dụng và bảo vệ thùng sồi</h3><p>Với thùng ủ, việc giữ tỷ lệ bay hơi (Angel's Share) dưới 2%/năm là ưu tiên cốt lõi. Nhiệt độ mát mẻ và độ ẩm được kiểm soát cơ học tại các hầm ZenTaro giúp lỗ chân lông gỗ sồi tiết vanillin và tannin bền bỉ nhất.</p>`,
        daysOffset: 4
    }
];

async function main() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
            }),
        });
    }
    const db = getFirestore();
    const col = db.collection(COLLECTIONS.ZENTARO_POSTS);

    // We can fetch default images from Pexels Search API
    const pexelsKey = process.env.PEXELS_API_KEY;
    let imageUrls: string[] = [];

    if (pexelsKey) {
        try {
            console.log('Fetching images from Pexels API...');
            const res = await fetch(
                `https://api.pexels.com/v1/search?query=luxury+whiskey&per_page=15&orientation=landscape`,
                { headers: { Authorization: pexelsKey } }
            );
            if (res.ok) {
                const body = await res.json();
                const photos: any[] = body?.photos ?? [];
                imageUrls = photos.map((p) => p.src?.large).filter((url) => !!url);
                console.log(`Fetched ${imageUrls.length} Pexels images.`);
            } else {
                console.warn(`Pexels API failed with status ${res.status}`);
            }
        } catch (err) {
            console.warn('Failed to call Pexels API:', err);
        }
    }

    // Fallbacks if Pexels API fails or key is missing
    const fallbackImages = [
        'https://images.pexels.com/photos/301692/pexels-photo-301692.jpeg', // whiskey bottle
        'https://images.pexels.com/photos/1098592/pexels-photo-1098592.jpeg', // barrels
        'https://images.pexels.com/photos/6027581/pexels-photo-6027581.jpeg', // luxury pour
        'https://images.pexels.com/photos/5946115/pexels-photo-5946115.jpeg', // glasses
        'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg'  // bar
    ];

    for (let i = 0; i < WHISKY_TECH_POSTS.length; i++) {
        const post = WHISKY_TECH_POSTS[i];

        const imageUrl = imageUrls[i % imageUrls.length] || fallbackImages[i % fallbackImages.length];

        // Construct HTML content (putting the image inside)
        const renderHtml = (title: string, body: string) =>
            `<img src="${imageUrl}" alt="${title}" style="width:100%;border-radius:12px;margin-bottom:1.5rem;" />${body}`;

        const contentHtmlKo = renderHtml(post.titleKo, post.contentKo);
        const contentHtmlEn = renderHtml(post.titleEn, post.contentEn);
        const contentHtmlVi = renderHtml(post.titleVi, post.contentVi);

        // Compute target timestamp
        // daysOffset * 86400 seconds from now
        const offsetSeconds = post.daysOffset * 24 * 60 * 60;
        const targetTimeSecs = Math.floor(Date.now() / 1000) + offsetSeconds;
        const targetTimestamp = Timestamp.fromMillis(targetTimeSecs * 1000);

        const payload = {
            title: post.titleVi, // Default base language is Vietnamese!
            contentHtml: contentHtmlVi, // Default base content is Vietnamese!
            titleKo: post.titleKo,
            titleEn: post.titleEn,
            titleVi: post.titleVi,
            contentHtmlKo,
            contentHtmlEn,
            contentHtmlVi,
            videoUrl: null,
            tags: ['📈 위스키재테크'],
            source: 'admin' as const,
            authorName: 'ZENTARO Tech Team',
            published: true,
            createdAt: targetTimestamp,
            updatedAt: targetTimestamp,
        };

        // Check if post already exists by titleKo
        const existing = await col.where('titleKo', '==', post.titleKo).limit(1).get();
        if (!existing.empty) {
            const docId = existing.docs[0].id;
            await col.doc(docId).update(payload);
            console.log(`Updated existing post: "${post.titleKo}" with default Vietnamese base fields`);
        } else {
            await col.add(payload);
            console.log(`Seeded new post: "${post.titleKo}" with date offset +${post.daysOffset} day(s)`);
        }
    }

    console.log('Done seeding Whisky Tech posts.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
