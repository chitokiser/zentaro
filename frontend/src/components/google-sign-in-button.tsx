"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { loginWithGoogle } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/i18n-context"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

// Google outright refuses OAuth/GSI sign-in inside embedded app webviews
// (KakaoTalk, Instagram, Facebook, Line, ...) and returns disallowed_useragent
// with no visible error on our side — the button just does nothing when
// tapped. There's no code-level bypass; the only fix is telling the user to
// reopen the page in a real browser via the host app's own menu.
const IN_APP_BROWSER_UA_PATTERN = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(|WhatsApp|Twitter/i

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false
  return IN_APP_BROWSER_UA_PATTERN.test(window.navigator.userAgent)
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            use_fedcm?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleSignInButton({
  onSuccess,
  referrerEmail,
}: {
  onSuccess: () => void
  referrerEmail?: string
}) {
  const { t } = useI18n()
  const buttonRef = useRef<HTMLDivElement>(null)
  const referrerEmailRef = useRef(referrerEmail)
  referrerEmailRef.current = referrerEmail
  const [inAppBrowser, setInAppBrowser] = useState(false)

  useEffect(() => {
    const detected = isInAppBrowser()
    setInAppBrowser(detected)
    if (!GOOGLE_CLIENT_ID || detected) return

    function render() {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID as string,
        auto_select: true,
        cancel_on_tap_outside: true,
        use_fedcm: false,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential, referrerEmailRef.current)
            onSuccess()
          } catch {
            // surfaced via the parent's error state on next interaction
          }
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      })
      // One Tap: silently re-authenticates returning Google members who
      // already granted consent, without them clicking the button again.
      window.google.accounts.id.prompt()
    }

    if (window.google) render()
    const interval = setInterval(() => {
      if (window.google) {
        render()
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google 로그인이 아직 설정되지 않았습니다.
      </p>
    )
  }

  if (inAppBrowser) {
    return (
      <p className="rounded-md border border-border/60 bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
        {t.myPage.profile.inAppBrowserWarning}
      </p>
    )
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  )
}
