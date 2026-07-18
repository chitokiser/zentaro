import { PageHeader, Section } from "@/components/page-header"
import { BrandPhilosophy } from "@/components/brand-philosophy"
import { CeoMessage } from "@/components/ceo-message"

export default function CompanyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="ZENTARO 소개"
        title="Company"
        description="브랜드 스토리, CEO 인사말, Vision & Mission"
      />
      <Section id="brand-story" title="브랜드 스토리" className="max-w-5xl">
        <BrandPhilosophy />
      </Section>
      <Section id="ceo-message" title="CEO 인사말" className="border-t border-border/60">
        <CeoMessage />
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
