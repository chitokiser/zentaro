import { DICTIONARIES } from "@/lib/i18n/translations";

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

export function getMainNav(t: (typeof DICTIONARIES)["ko"]): NavGroup[] {
  return [
    {
      label: t.nav.about.label,
      href: "/about/company",
      items: [
        { label: t.nav.aboutItems.brandStory, href: "/about/company#brand-story" },
        { label: t.nav.aboutItems.ceoMessage, href: "/about/company#ceo-message" },
        { label: t.nav.aboutItems.vision, href: "/about/company#vision-mission" },
        { label: t.nav.aboutItems.distilleryIntro, href: "/about/distillery#intro" },
        { label: t.nav.aboutItems.distilleryProcess, href: "/about/distillery#process" },
        { label: t.nav.aboutItems.barrelRoom, href: "/about/distillery#barrel-room" },
        { label: t.nav.aboutItems.equipment, href: "/about/distillery#equipment" },
        { label: t.nav.aboutItems.labIntro, href: "/about/research-lab#intro" },
        { label: t.nav.aboutItems.projects, href: "/about/research-lab#projects" },
        { label: t.nav.aboutItems.botanicalLibrary, href: "/about/research-lab#botanical-library" },
        { label: t.nav.aboutItems.lab, href: "/about/research-lab#lab" },
        { label: t.nav.aboutItems.business, href: "/about/business" },
      ],
    },
    {
      label: t.nav.service.label,
      href: "/mall",
      items: [
        { label: t.nav.serviceItems.mall, href: "/mall", description: t.nav.serviceItems.mallDesc },
        {
          label: t.nav.serviceItems.bottleCap,
          href: "/rewards/bottle-cap",
          description: t.nav.serviceItems.bottleCapDesc,
        },
        {
          label: t.nav.serviceItems.nft,
          href: "/exchange",
          description: t.nav.serviceItems.nftDesc,
        },
        {
          label: t.nav.serviceItems.jumpToken,
          href: "/rewards/jump-token",
          description: t.nav.serviceItems.jumpTokenDesc,
        },
        {
          label: t.nav.serviceItems.contribution,
          href: "/rewards/contribution",
          description: t.nav.serviceItems.contributionDesc,
        },
        {
          label: t.nav.serviceItems.webzine,
          href: "/webzine",
          description: t.nav.serviceItems.webzineDesc,
        },
      ],
    },
    {
      label: t.nav.myPage.label,
      href: "/my/profile",
      items: [
        { label: t.nav.myPageItems.profile, href: "/my/profile", description: t.nav.myPageItems.profileDesc },
        { label: t.nav.myPageItems.mentor, href: "/my/mentor", description: t.nav.myPageItems.mentorDesc },
        { label: t.nav.myPageItems.wallet, href: "/my/wallet", description: t.nav.myPageItems.walletDesc },
      ],
    },
  ];
}
