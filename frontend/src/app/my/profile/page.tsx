"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getToken, login, register, clearToken } from "@/lib/auth-client"
import { GoogleSignInButton } from "@/components/google-sign-in-button"

export default function ProfilePage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "register") {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
      setLoggedIn(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (loggedIn) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-display text-lg font-medium">회원정보</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          로그인되었습니다. 지갑 정보는 My Wallet 탭에서 확인할 수 있습니다.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            clearToken()
            setLoggedIn(false)
          }}
        >
          로그아웃
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-border/60 bg-card p-6">
      <div className="mb-6 flex gap-2 text-sm">
        <button
          className={`rounded-full px-3 py-1 ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          로그인
        </button>
        <button
          className={`rounded-full px-3 py-1 ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          onClick={() => setMode("register")}
          type="button"
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="닉네임"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        )}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border/60" />
        또는
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <GoogleSignInButton onSuccess={() => setLoggedIn(true)} />
    </div>
  )
}
