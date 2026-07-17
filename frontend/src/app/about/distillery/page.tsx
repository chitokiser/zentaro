import { PageHeader, Section } from "@/components/page-header"

const EQUIPMENT = [
  { name: "Still Spirits Air Still Pro + Botanical Basket", use: "Vapor Infusion Gin 연구" },
  { name: "Copper Reflux Still", use: "고도주 및 중성주 제조 연구" },
  { name: "500ml Glass Distillation Set", use: "소량 실험용 증류" },
]

export default function DistilleryPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ZENTARO 소개"
        title="Distillery"
        description="증류소 소개, 증류 과정, Barrel Room, 증류 장비"
      />
      <Section id="intro" title="증류소 소개">
        <p>
          ZENTARO 증류소는 프리미엄 진(Gin), 리큐르(Liqueur), 보태니컬
          추출물을 연구·개발하는 크래프트 증류 시설입니다.
        </p>
      </Section>
      <Section id="process" title="증류 과정" className="border-t border-border/60">
        <p>
          보태니컬 계량 → 침용(Maceration) → Vapor Infusion 증류 → 커팅
          (Heads/Hearts/Tails 분리) → 희석 및 병입까지, 모든 배치는
          수작업으로 관리됩니다.
        </p>
      </Section>
      <Section id="barrel-room" title="Barrel Room" className="border-t border-border/60">
        <p>
          오크통 안에서 시간이 빚어내는 색과 향의 변화를 그대로 담아내는
          숙성 공간입니다. (Aging Timeline 콘텐츠는 추후 이 섹션에 연동될
          예정입니다.)
        </p>
      </Section>
      <Section id="equipment" title="증류 장비 소개" className="border-t border-border/60">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">장비</th>
                <th className="px-4 py-2 font-medium">용도</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT.map((eq) => (
                <tr key={eq.name} className="border-t border-border/60">
                  <td className="px-4 py-2">{eq.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{eq.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
