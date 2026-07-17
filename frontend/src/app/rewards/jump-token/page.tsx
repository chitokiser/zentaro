import { PageHeader, Section } from "@/components/page-header"

export default function JumpTokenHolderPage() {
  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="Jump Token Holder"
        description="점프토큰 보유자 혜택"
      />
      <Section title="혜택">
        <ul className="list-disc space-y-2 pl-5">
          <li>스테이킹</li>
          <li>보상 포인트</li>
          <li>제품 할인</li>
          <li>VIP 멤버십</li>
          <li>이벤트 참여</li>
        </ul>
      </Section>
    </div>
  )
}
