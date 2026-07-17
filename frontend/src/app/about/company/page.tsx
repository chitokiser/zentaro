import { PageHeader, Section } from "@/components/page-header"

export default function CompanyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ZENTARO 소개"
        title="Company"
        description="브랜드 스토리, CEO 인사말, Vision & Mission"
      />
      <Section id="brand-story" title="브랜드 스토리">
        <p>
          ZENTARO는 증류, 허브, 숙성, 사람이라는 네 가지 여정이 만나 완성되는
          크래프트 증류소입니다. 구리 단식 증류기에서 한 방울씩 뽑아낸
          스피릿에 엄선한 보태니컬을 더해, 시간이 빚어내는 깊은 풍미를
          병에 담습니다.
        </p>
      </Section>
      <Section id="ceo-message" title="CEO 인사말" className="border-t border-border/60">
        <p>
          ZENTARO를 찾아주신 모든 분들께 감사드립니다. 저희는 작은 증류소에서
          출발했지만, 동남아를 대표하는 크래프트 증류 연구소이자 체험형
          증류소로 성장하는 것을 목표로 하고 있습니다. 앞으로도 정직한
          재료와 연구로 신뢰받는 브랜드가 되겠습니다.
        </p>
      </Section>
      <Section id="vision-mission" title="Vision & Mission" className="border-t border-border/60">
        <ul className="list-disc space-y-2 pl-5">
          <li>ZenTaro 시그니처 증류주 브랜드 개발</li>
          <li>지역 특산물을 활용한 프리미엄 보태니컬 제품 개발</li>
          <li>OEM/ODM 공동 개발 및 생산</li>
          <li>체험형 관광 프로그램 운영</li>
          <li>보태니컬 데이터베이스와 레시피 자산 구축</li>
        </ul>
      </Section>
    </div>
  )
}
