"use client"

import Link from "next/link"
import { MessageCircle, Camera, Send, PlayCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

const SOCIAL_LINKS = [
  { label: "YouTube", href: "https://youtube.com", icon: PlayCircle },
  { label: "Instagram", href: "https://instagram.com", icon: Camera },
  { label: "Telegram", href: "https://t.me", icon: Send },
  { label: "Facebook", href: "https://facebook.com", icon: MessageCircle },
]

export function SiteFooter() {
  const { t } = useI18n()

  const footerLinks = [
    { label: t.footer.about, href: "/about/company" },
    { label: t.footer.contact, href: "/contact" },
    { label: t.footer.certifications, href: "/about/certifications" },
    { label: t.footer.vendorInquiry, href: "/vendor-inquiry" },
    { label: t.footer.terms, href: "/terms" },
    { label: t.footer.privacy, href: "/privacy" },
    { label: t.footer.community, href: "/community" },
  ]

  return (
    <footer className="border-t border-border/60 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="font-display text-lg font-semibold tracking-[0.2em] text-primary">
              ZENTARO
            </span>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZENTARO. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
