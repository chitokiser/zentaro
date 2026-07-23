import { readdirSync } from "fs"
import path from "path"
import { CertificationsPageContent } from "@/components/certifications-page-content"

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
