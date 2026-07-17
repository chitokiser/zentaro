import { PageHeader, Section } from "@/components/page-header"

export default function BottleCapRewardsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="서비스"
        title="Bottle Cap Rewards"
        description="병뚜껑 리워드"
      />
      <Section title="이용 방법">
        <ul className="list-disc space-y-2 pl-5">
          <li>병뚜껑으로 지급된 Ticket 등록</li>
          <li>Ticket 보관</li>
          <li>Ticket P2P 전송</li>
          <li>Ticket 사용내역</li>
        </ul>
      </Section>
    </div>
  )
}
