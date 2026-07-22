import type { Locale } from "./translations"

// Category names are stored in Firestore as their Korean label (used as the
// canonical id). This maps that Korean label to a display string for en/vi
// locales — display-only, storage/admin dropdowns stay Korean.
const CATEGORY_TRANSLATIONS: Record<string, { en: string; vi: string }> = {
  // Main categories
  "위스키": { en: "Whisky", vi: "Whisky" },
  "와인": { en: "Wine", vi: "Rượu vang" },
  "진(Gin)": { en: "Gin", vi: "Gin" },
  "럼(Rum)": { en: "Rum", vi: "Rum" },
  "보드카": { en: "Vodka", vi: "Vodka" },
  "증류식 소주": { en: "Distilled Soju", vi: "Soju chưng cất" },
  "전통주": { en: "Traditional Liquor", vi: "Rượu truyền thống" },
  "베트남 전통주": { en: "Vietnamese Traditional Liquor", vi: "Rượu truyền thống Việt Nam" },
  "허브식품": { en: "Herb Food", vi: "Thực phẩm thảo mộc" },
  "위스키 용품": { en: "Whisky Accessories", vi: "Phụ kiện Whisky" },
  "와인 용품": { en: "Wine Accessories", vi: "Phụ kiện rượu vang" },
  "바(Bar) 용품": { en: "Bar Accessories", vi: "Phụ kiện quầy bar" },
  "허브시즈닝": { en: "Herb Seasoning", vi: "Gia vị thảo mộc" },
  "허브생활": { en: "Herb Lifestyle", vi: "Sản phẩm thảo mộc sinh hoạt" },
  "식물오일": { en: "Botanical Oils", vi: "Tinh dầu thực vật" },

  // 위스키
  "싱글 몰트": { en: "Single Malt", vi: "Single Malt" },
  "블렌디드 위스키": { en: "Blended Whisky", vi: "Whisky Blend" },
  "그레인 위스키": { en: "Grain Whisky", vi: "Whisky Grain" },
  "블렌디드 몰트": { en: "Blended Malt", vi: "Malt Blend" },
  "버번": { en: "Bourbon", vi: "Bourbon" },
  "라이 위스키": { en: "Rye Whisky", vi: "Whisky Rye" },
  "테네시 위스키": { en: "Tennessee Whisky", vi: "Whisky Tennessee" },
  "아이리시 위스키": { en: "Irish Whisky", vi: "Whisky Ireland" },
  "캐나다 위스키": { en: "Canadian Whisky", vi: "Whisky Canada" },
  "일본 위스키": { en: "Japanese Whisky", vi: "Whisky Nhật Bản" },
  "월드 위스키": { en: "World Whisky", vi: "Whisky Thế giới" },

  // 와인
  "레드 와인": { en: "Red Wine", vi: "Rượu vang đỏ" },
  "화이트 와인": { en: "White Wine", vi: "Rượu vang trắng" },
  "로제 와인": { en: "Rosé Wine", vi: "Rượu vang hồng" },
  "스파클링": { en: "Sparkling", vi: "Rượu vang sủi bọt" },
  "디저트 와인": { en: "Dessert Wine", vi: "Rượu vang tráng miệng" },

  // 진(Gin)
  "런던 드라이 진": { en: "London Dry Gin", vi: "Gin London Dry" },
  "올드 톰 진": { en: "Old Tom Gin", vi: "Gin Old Tom" },
  "네이비 스트렝스": { en: "Navy Strength", vi: "Navy Strength" },
  "컨템포러리 진": { en: "Contemporary Gin", vi: "Gin đương đại" },
  "제네버": { en: "Genever", vi: "Genever" },
  "슬로 진": { en: "Sloe Gin", vi: "Gin Sloe" },

  // 럼(Rum)
  "화이트 럼": { en: "White Rum", vi: "Rum trắng" },
  "골드 럼": { en: "Gold Rum", vi: "Rum vàng" },
  "다크 럼": { en: "Dark Rum", vi: "Rum sẫm màu" },
  "스파이스드 럼": { en: "Spiced Rum", vi: "Rum gia vị" },
  "아네호(숙성) 럼": { en: "Añejo (Aged) Rum", vi: "Rum Añejo (ủ lâu năm)" },
  "아그리콜 럼": { en: "Agricole Rum", vi: "Rum Agricole" },
  "데메라라 럼": { en: "Demerara Rum", vi: "Rum Demerara" },
  "오버프루프 럼": { en: "Overproof Rum", vi: "Rum nồng độ cao (Overproof)" },

  // 보드카
  "러시아 보드카": { en: "Russian Vodka", vi: "Vodka Nga" },
  "폴란드 보드카": { en: "Polish Vodka", vi: "Vodka Ba Lan" },
  "스칸디나비아 보드카": { en: "Scandinavian Vodka", vi: "Vodka Scandinavia" },
  "프랑스·서유럽 보드카": { en: "French & Western European Vodka", vi: "Vodka Pháp & Tây Âu" },
  "북미 크래프트 보드카": { en: "North American Craft Vodka", vi: "Vodka thủ công Bắc Mỹ" },

  // 증류식 소주
  "ZENTARO 오리지널": { en: "ZENTARO Original", vi: "ZENTARO Original" },
  "화요 시리즈": { en: "Hwayo Series", vi: "Dòng Hwayo" },
  "안동소주 계열": { en: "Andong Soju Line", vi: "Dòng Soju Andong" },
  "전통 명주": { en: "Traditional Masterpiece Liquor", vi: "Rượu truyền thống danh tiếng" },
  "프리미엄 대기업 소주": { en: "Premium Corporate Soju", vi: "Soju cao cấp thương hiệu lớn" },

  // 전통주
  "막걸리": { en: "Makgeolli", vi: "Makgeolli" },
  "약주": { en: "Yakju", vi: "Yakju" },
  "청주": { en: "Cheongju", vi: "Cheongju" },
  "과실주": { en: "Fruit Wine", vi: "Rượu trái cây" },

  // 베트남 전통주
  "증류식 쌀술": { en: "Distilled Rice Liquor", vi: "Rượu gạo chưng cất" },
  "항아리 발효주": { en: "Jar-Fermented Liquor", vi: "Rượu ủ trong chum" },
  "찹쌀술": { en: "Glutinous Rice Liquor", vi: "Rượu nếp" },
  "약재 침용주": { en: "Herbal Medicinal Infused Liquor", vi: "Rượu ngâm thuốc" },

  // 허브식품
  "허브훈제": { en: "Herb Smoked", vi: "Đồ hun khói thảo mộc" },
  "허브치즈": { en: "Herb Cheese", vi: "Phô mai thảo mộc" },
  "허브소세지": { en: "Herb Sausage", vi: "Xúc xích thảo mộc" },
  "허브사탕": { en: "Herb Candy", vi: "Kẹo thảo mộc" },
  "허브초콜릿": { en: "Herb Chocolate", vi: "Sô-cô-la thảo mộc" },

  // 위스키 용품
  "위스키 잔": { en: "Whisky Glass", vi: "Ly Whisky" },
  "디캔터": { en: "Decanter", vi: "Bình rót rượu (Decanter)" },
  "아이스볼": { en: "Ice Ball", vi: "Viên đá tròn" },
  "아이스 몰드": { en: "Ice Mold", vi: "Khuôn đá" },
  "위스키 스톤": { en: "Whisky Stones", vi: "Đá Whisky" },
  "병마개": { en: "Bottle Stopper", vi: "Nút chai" },
  "바 트레이": { en: "Bar Tray", vi: "Khay bar" },
  "보관함": { en: "Storage Case", vi: "Hộp bảo quản" },

  // 와인 용품
  "와인잔": { en: "Wine Glass", vi: "Ly rượu vang" },
  "코르크스크루": { en: "Corkscrew", vi: "Dụng cụ mở nút chai" },
  "진공마개": { en: "Vacuum Stopper", vi: "Nút chân không" },
  "와인쿨러": { en: "Wine Cooler", vi: "Tủ làm lạnh rượu vang" },
  "와인랙": { en: "Wine Rack", vi: "Kệ rượu vang" },

  // 바(Bar) 용품
  "셰이커": { en: "Shaker", vi: "Bình lắc (Shaker)" },
  "지거": { en: "Jigger", vi: "Ly đong (Jigger)" },
  "바스푼": { en: "Bar Spoon", vi: "Muỗng bar" },
  "스트레이너": { en: "Strainer", vi: "Rây lọc (Strainer)" },
  "믹싱글라스": { en: "Mixing Glass", vi: "Ly pha chế" },
  "머들러": { en: "Muddler", vi: "Chày dầm (Muddler)" },
  "얼음통": { en: "Ice Bucket", vi: "Xô đá" },
  "칵테일 픽": { en: "Cocktail Pick", vi: "Que xiên cocktail" },

  // 허브시즈닝
  "레몬그라스 시즈닝": { en: "Lemongrass Seasoning", vi: "Gia vị sả" },
  "피시소스 시즈닝": { en: "Fish Sauce Seasoning", vi: "Gia vị nước mắm" },
  "오향 스파이스 블렌드": { en: "Five-Spice Blend", vi: "Hỗn hợp ngũ vị hương" },
  "칠리라임 솔트": { en: "Chili Lime Salt", vi: "Muối ớt chanh" },
  "쌀국수&분짜 시즈닝": { en: "Pho & Bun Cha Seasoning", vi: "Gia vị phở & bún chả" },

  // 허브생활
  "허브 샴푸": { en: "Herb Shampoo", vi: "Dầu gội thảo mộc" },
  "허브 비누": { en: "Herb Soap", vi: "Xà phòng thảo mộc" },
  "허브 호흡기케어": { en: "Herb Respiratory Care", vi: "Chăm sóc hô hấp thảo mộc" },
  "허브 건강식품": { en: "Herb Health Food", vi: "Thực phẩm chức năng thảo mộc" },
  "허브 모기기피제": { en: "Herb Mosquito Repellent", vi: "Chống muỗi thảo mộc" },
  "허브 스킨케어": { en: "Herb Skincare", vi: "Chăm sóc da thảo mộc" },

  // 식물오일
  "에센셜 오일": { en: "Essential Oil", vi: "Tinh dầu" },
  "캐리어 오일": { en: "Carrier Oil", vi: "Dầu nền (Carrier Oil)" },
  "아로마 오일": { en: "Aroma Oil", vi: "Dầu thơm (Aroma Oil)" },
  "마사지 오일": { en: "Massage Oil", vi: "Dầu massage" },
};

export function localizedCategory(locale: Locale, name: string | undefined | null): string {
  if (!name) return "";
  if (locale === "ko") return name;
  const entry = CATEGORY_TRANSLATIONS[name];
  if (!entry) return name;
  return locale === "en" ? entry.en : entry.vi;
}

const FULFILLMENT_TRANSLATIONS: Record<string, { ko: string; en: string; vi: string }> = {
  dropshipping: { ko: "드랍쉬핑", en: "Dropshipping", vi: "Dropshipping" },
  direct: { ko: "직배송(자체재고)", en: "Direct Delivery (In-house Stock)", vi: "Giao hàng trực tiếp (Kho riêng)" },
};

export function localizedFulfillment(locale: Locale, type: string | undefined | null): string {
  const entry = FULFILLMENT_TRANSLATIONS[type ?? "dropshipping"] ?? FULFILLMENT_TRANSLATIONS.dropshipping;
  return entry[locale];
}
