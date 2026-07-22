import { readdirSync } from "fs"
import path from "path"
import { PageHeader } from "@/components/page-header"
import { CertificationsGallery } from "@/components/certifications-gallery"

function getCertificationImages(): string[] {
  const dir = path.join(process.cwd(), "public", "images", "certification")
  try {
    return readdirSync(dir)
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort()
      .map((file) => `/images/certification/${file}`)
  } catch {
    return []
  }
}

export default function CertificationsPage() {
  const images = getCertificationImages()

  return (
    <div>
      <PageHeader
        eyebrow="ZENTARO 소개"
        title="인증 · 허가 서류"
        description="ZENTARO가 보유한 자격, 허가 및 관련 인증 서류입니다."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {images.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            등록된 인증 서류가 없습니다.
          </p>
        ) : (
          <CertificationsGallery images={images} />
        )}
      </div>
    </div>
  )
}
