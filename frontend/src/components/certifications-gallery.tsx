"use client"

import { useState } from "react"
import Image from "next/image"

export function CertificationsGallery({ images }: { images: string[] }) {
  const [activeImage, setActiveImage] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setActiveImage(src)}
            className="overflow-hidden rounded-lg border border-border/60 bg-card cursor-zoom-in transition hover:border-primary/50"
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
          </button>
        ))}
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 text-2xl text-white/80 hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
          <img
            src={activeImage}
            alt="ZENTARO 인증 서류 원본"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
