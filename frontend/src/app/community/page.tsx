"use client"

import { PageHeader } from "@/components/page-header"
import { Community } from "@/components/home/community"
import { useI18n } from "@/lib/i18n/i18n-context"

export default function CommunityPage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader eyebrow={t.community.eyebrow} title={t.community.title} description={t.community.description} />
      <Community />
    </div>
  )
}
