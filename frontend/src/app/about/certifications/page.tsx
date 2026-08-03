import type { Metadata } from "next"
import { readdirSync } from "fs"
import path from "path"
import { CertificationsPageContent } from "@/components/certifications-page-content"

export const metadata: Metadata = {
  title: "인증서 | ZENTARO",
  description: "ZENTARO PHUC LOC 증류소가 보유한 품질/안전 인증서를 확인하세요.",
  alternates: { canonical: "/about/certifications" },
}

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
  return <CertificationsPageContent images={images} />
}
