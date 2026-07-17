import { PageHeader, Section } from "@/components/page-header"

export default function NftRewardsPage() {
  return (
    <div>
      <PageHeader eyebrow="서비스" title="NFT Rewards" description="NFT 컬렉션" />
      <Section title="구성">
        <ul className="list-disc space-y-2 pl-5">
          <li>보유 NFT</li>
          <li>등급</li>
          <li>이벤트 참여</li>
          <li>한정판 교환</li>
        </ul>
      </Section>
    </div>
  )
}
