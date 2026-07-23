"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "zentaro_install_dismissed"

function isIos(): boolean {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
}

export function PwaInstallPrompt() {
  const { t } = useI18n()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (isStandalone()) return
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return
    setDismissed(false)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)

    if (isIos()) {
      setShowIosHint(true)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    window.localStorage.setItem(DISMISS_KEY, "1")
  }

  if (dismissed) return null
  if (!deferredPrompt && !showIosHint) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur">
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">{t.pwaInstall.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {showIosHint && !deferredPrompt ? t.pwaInstall.iosHint : t.pwaInstall.description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt && (
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="mr-1.5 size-4" />
            {t.pwaInstall.installCta}
          </Button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.pwaInstall.dismissAria}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
