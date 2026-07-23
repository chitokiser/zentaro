"use client"

import { PageHeader } from "@/components/page-header"
import { CertificationsGallery } from "@/components/certifications-gallery"
import { useI18n } from "@/lib/i18n/i18n-context"

export function CertificationsPageContent({ images }: { images: string[] }) {
  const { t } = useI18n()
  const c = t.about.certifications

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {images.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{c.empty}</p>
        ) : (
          <CertificationsGallery images={images} />
        )}
      </div>
    </div>
  )
}
