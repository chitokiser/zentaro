"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchAdminUsers,
  promoteAdminUser,
  setAdminUserLevel,
  type AdminUserSummary,
} from "@/lib/auth-client"

const LEVEL_LABEL: Record<number, string> = {
  1: "최고관리자",
  2: "운영관리자",
  3: "스탭",
}

export default function AdminMembersPage() {
  const [admins, setAdmins] = useState<AdminUserSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busyUid, setBusyUid] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [level, setLevel] = useState<"1" | "2" | "3">("3")
  const [promoteBusy, setPromoteBusy] = useState(false)

  const load = useCallback(() => {
    fetchAdminUsers()
      .then(setAdmins)
      .catch((err) => setError(err instanceof Error ? err.message : "조회에 실패했습니다. (최고관리자만 접근 가능합니다)"))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault()
    setPromoteBusy(true)
    setError(null)
    setMessage(null)
    try {
      await promoteAdminUser(email, Number(level) as 1 | 2 | 3)
      setMessage(`"${email}"을(를) ${LEVEL_LABEL[Number(level)]}(으)로 등록했습니다.`)
      setEmail("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.")
    } finally {
      setPromoteBusy(false)
    }
  }

  async function handleChangeLevel(uid: string, newLevel: 1 | 2 | 3 | null) {
    setBusyUid(uid)
    setError(null)
    setMessage(null)
    try {
      await setAdminUserLevel(uid, newLevel)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.")
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-xl font-semibold">회원 관리</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          관리자 등급: 1(최고관리자) · 2(운영관리자) · 3(스탭). 최고관리자만 등급을 변경할 수 있습니다.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-primary/30 bg-secondary/40 px-4 py-2 text-sm text-primary">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">새 관리자 등록</h3>
        <form onSubmit={handlePromote} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            className="min-w-[220px] flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            placeholder="회원 이메일 (ZENTARO 가입 계정)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={level}
            onChange={(e) => setLevel(e.target.value as "1" | "2" | "3")}
          >
            <option value="1">1등급 최고관리자</option>
            <option value="2">2등급 운영관리자</option>
            <option value="3">3등급 스탭</option>
          </select>
          <Button type="submit" disabled={promoteBusy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {promoteBusy ? "등록 중..." : "등록"}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h3 className="font-display text-base font-medium">현재 관리자 ({admins?.length ?? 0})</h3>
        <div className="mt-4 flex flex-col gap-2">
          {admins?.map((admin) => (
            <div key={admin.uid} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{admin.displayName ?? admin.email}</span>
                <span className="text-xs text-muted-foreground">{admin.email}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {admin.adminLevel ? LEVEL_LABEL[admin.adminLevel] : "-"}
                </Badge>
              </div>
              <div className="flex gap-1">
                {([1, 2, 3] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={admin.adminLevel === lvl ? "default" : "ghost"}
                    disabled={busyUid === admin.uid}
                    className={admin.adminLevel === lvl ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    onClick={() => handleChangeLevel(admin.uid, lvl)}
                  >
                    {lvl}등급
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyUid === admin.uid}
                  onClick={() => handleChangeLevel(admin.uid, null)}
                >
                  해제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
