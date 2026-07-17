import { PageHeader } from "@/components/page-header"
import { Community } from "@/components/home/community"

export default function CommunityPage() {
  return (
    <div>
      <PageHeader eyebrow="ZENTARO" title="Official Community" description="공지사항 및 SNS 채널" />
      <Community />
    </div>
  )
}
