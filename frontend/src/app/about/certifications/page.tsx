import Image from "next/image"
import { readdirSync } from "fs"
import path from "path"
import { PageHeader } from "@/components/page-header"

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((src) => (
              <div
                key={src}
                className="overflow-hidden rounded-lg border border-border/60 bg-card"
              >
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={src}
                    alt="ZENTARO 인증 서류"
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
