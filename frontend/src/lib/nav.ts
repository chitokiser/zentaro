export interface NavLeaf {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href: string;
  items: NavLeaf[];
}

export const MAIN_NAV: NavGroup[] = [
  {
    label: "ZENTARO 소개",
    href: "/about/company",
    items: [
      { label: "브랜드 스토리", href: "/about/company#brand-story" },
      { label: "CEO 인사말", href: "/about/company#ceo-message" },
      { label: "Vision & Mission", href: "/about/company#vision-mission" },
      { label: "증류소 소개", href: "/about/distillery#intro" },
      { label: "증류 과정", href: "/about/distillery#process" },
      { label: "Barrel Room", href: "/about/distillery#barrel-room" },
      { label: "증류 장비 소개", href: "/about/distillery#equipment" },
      { label: "연구소 소개", href: "/about/research-lab#intro" },
      { label: "개발 프로젝트", href: "/about/research-lab#projects" },
      { label: "Botanical Library", href: "/about/research-lab#botanical-library" },
      { label: "실험실", href: "/about/research-lab#lab" },
      { label: "사업부 소개", href: "/about/business" },
    ],
  },
  {
    label: "서비스",
    href: "/mall",
    items: [
      { label: "ZENTARO Mall", href: "/mall", description: "프리미엄 쇼핑몰" },
      {
        label: "Bottle Cap Rewards",
        href: "/rewards/bottle-cap",
        description: "병뚜껑 리워드",
      },
      {
        label: "NFT Rewards",
        href: "/rewards/nft",
        description: "NFT 컬렉션",
      },
      {
        label: "Jump Token Holder",
        href: "/rewards/jump-token",
        description: "점프토큰 보유자 혜택",
      },
    ],
  },
  {
    label: "My Page",
    href: "/my/profile",
    items: [
      { label: "Profile", href: "/my/profile", description: "회원정보" },
      { label: "Mentor", href: "/my/mentor", description: "멘토 관리" },
      { label: "My Wallet", href: "/my/wallet", description: "내 지갑" },
    ],
  },
];
