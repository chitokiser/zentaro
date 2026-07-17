import { MessageCircle, Camera, Send, PlayCircle } from "lucide-react"

const CHANNELS = [
  { label: "YouTube", icon: PlayCircle, href: "https://youtube.com" },
  { label: "Instagram", icon: Camera, href: "https://instagram.com" },
  { label: "Telegram", icon: Send, href: "https://t.me" },
  { label: "Facebook", icon: MessageCircle, href: "https://facebook.com" },
]

export function Community() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="text-xs font-medium uppercase tracking-[0.4em] text-primary">
        Community
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        ZENTARO와 함께하기
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        공지사항과 SNS 채널을 통해 ZENTARO의 새로운 소식을 만나보세요.
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
