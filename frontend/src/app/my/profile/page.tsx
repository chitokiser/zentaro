"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  getToken,
  login,
  register,
  clearToken,
  fetchShippingAddress,
  updateShippingAddress,
  type ShippingAddress,
} from "@/lib/auth-client"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useI18n } from "@/lib/i18n/i18n-context"

const EMPTY_ADDRESS: ShippingAddress = {
  recipientName: "",
  phone: "",
  postalCode: "",
  addressLine1: "",
  addressLine2: "",
  deliveryMemo: "",
}

function ShippingAddressSection() {
  const { t } = useI18n()
  const p = t.myPage.profile
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShippingAddress()
      .then((a) => {
        if (a) setAddress(a)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateShippingAddress(address)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : p.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <form onSubmit={handleSave} className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-6">
      <h3 className="font-display text-lg font-medium">{p.shippingTitle}</h3>
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.recipientPlaceholder}
        value={address.recipientName}
        onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
      />
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.phonePlaceholder}
        value={address.phone}
        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
      />
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.postalCodePlaceholder}
        value={address.postalCode}
        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
      />
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.addressPlaceholder}
        value={address.addressLine1}
        onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
      />
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.addressDetailPlaceholder}
        value={address.addressLine2 ?? ""}
        onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
      />
      <input
        className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        placeholder={p.deliveryMemoPlaceholder}
        value={address.deliveryMemo ?? ""}
        onChange={(e) => setAddress({ ...address, deliveryMemo: e.target.value })}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {saved ? <p className="text-xs text-primary">{p.savedNotice}</p> : null}
      <Button type="submit" disabled={saving} variant="outline" className="mt-1">
        {saving ? p.saving : p.saveShipping}
      </Button>
    </form>
  )
}

export default function ProfilePage() {
  const { t } = useI18n()
  const p = t.myPage.profile
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
      setError(err instanceof Error ? err.message : p.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (loggedIn) {
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-display text-lg font-medium">{p.accountInfoTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{p.loggedInNotice}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            clearToken()
            setLoggedIn(false)
          }}
        >
          {p.logout}
        </Button>
        <ShippingAddressSection />
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
          {p.loginTab}
        </button>
        <button
          className={`rounded-full px-3 py-1 ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          onClick={() => setMode("register")}
          type="button"
        >
          {p.registerTab}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <input
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder={p.nicknamePlaceholder}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        )}
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          type="email"
          placeholder={p.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          type="password"
          placeholder={p.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? p.processing : mode === "login" ? p.loginTab : p.registerTab}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border/60" />
        {p.orDivider}
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <GoogleSignInButton onSuccess={() => setLoggedIn(true)} />
    </div>
  )
}
