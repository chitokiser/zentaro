import { PageHeader, Section } from "@/components/page-header"

const BOTANICALS = [
  "Juniper Berry", "Coriander Seed", "Angelica Root", "Orris Root",
  "Licorice Root", "Cardamom", "Saigon Cinnamon", "Star Anise",
  "Black Pepper", "Pink Pepper", "Lemongrass", "Lotus Flower",
  "Jasmine Flower", "Rose Petals", "Hibiscus", "Freeze Dried Yuzu Peel",
]

const PROJECTS = [
  "Dry Gin 개발", "Botanical Gin 개발", "Strawberry Liqueur 개발",
  "Fruit Liqueur 개발", "Botanical Spirit 개발", "Essential Oil 추출",
  "Botanical Extract 연구", "증류 공정 연구", "향료 연구", "체험 프로그램 개발",
]

export default function ResearchLabPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ZENTARO 소개"
        title="Research Lab"
        description="ZenTaro R&D Lab — Craft Distillery Research & Development Laboratory"
      />
      <Section id="intro" title="연구소 소개">
        <p>
          ZenTaro R&amp;D Lab은 프리미엄 진(Gin), 리큐르(Liqueur), 보태니컬
          추출물(Botanical Extract)을 연구·개발하는 크래프트 증류 연구실입니다.
          신제품 개발뿐 아니라 관광 체험 프로그램, OEM/ODM 개발, 향료 연구까지
          수행할 수 있는 기반 시설 구축을 목표로 합니다.
        </p>
      </Section>
      <Section id="projects" title="개발 프로젝트" className="border-t border-border/60">
        <div className="flex flex-wrap gap-2">
          {PROJECTS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs"
            >
              {p}
            </span>
          ))}
        </div>
      </Section>
      <Section id="botanical-library" title="Botanical Library" className="border-t border-border/60">
        <p className="mb-4">
          ZENTARO가 연구하는 대표 보태니컬 원료입니다. 각 원료의 향과 특징은
          추후 상세 페이지로 확장될 예정입니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {BOTANICALS.map((b) => (
            <span
              key={b}
              className="rounded-full bg-secondary px-4 py-1.5 text-xs text-foreground"
            >
              {b}
            </span>
          ))}
        </div>
      </Section>
      <Section id="lab" title="실험실" className="border-t border-border/60">
        <p>
          증류 장비, 측정 장비(비중계·굴절계·pH미터), 계량 장비, 원료 가공
          장비를 갖춘 실험 공간에서 신제품과 향료 연구가 이루어집니다.
        </p>
      </Section>
    </div>
  )
}
