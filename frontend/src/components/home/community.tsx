"use client"

import { MessageCircle, Camera, Send, PlayCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

const CHANNELS = [
  { label: "YouTube", icon: PlayCircle, href: "https://youtube.com" },
  { label: "Instagram", icon: Camera, href: "https://instagram.com" },
  { label: "Telegram", icon: Send, href: "https://t.me" },
  { label: "Facebook", icon: MessageCircle, href: "https://facebook.com" },
]

export function Community() {
  const { t } = useI18n()

  return (
    <section className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
        {t.home.community.eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        {t.home.community.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        {t.home.community.description}
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {CHANNELS.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Icon className="size-4" />
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
