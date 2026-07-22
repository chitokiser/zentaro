"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchAdminUsers,
  promoteAdminUser,
  setAdminUserLevel,
  fetchAllMembersAdmin,
  adjustMemberExp,
  type AdminUserSummary,
  type MemberSummary,
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

  const [members, setMembers] = useState<MemberSummary[] | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [expInputs, setExpInputs] = useState<Record<string, string>>({})
  const [expReasonInputs, setExpReasonInputs] = useState<Record<string, string>>({})
  const [expBusyUid, setExpBusyUid] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchAdminUsers()
      .then(setAdmins)
      .catch((err) => setError(err instanceof Error ? err.message : "조회에 실패했습니다. (최고관리자만 접근 가능합니다)"))
  }, [])

  const loadMembers = useCallback(() => {
    fetchAllMembersAdmin()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "회원 조회에 실패했습니다."))
  }, [])

  useEffect(() => {
    load()
    loadMembers()
  }, [load, loadMembers])

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

  async function handleAdjustExp(uid: string) {
    const raw = expInputs[uid]
    const amount = Number(raw)
    if (!raw || !Number.isInteger(amount) || amount === 0) {
      alert("충전/차감할 EXP 수량을 정수로 입력해 주세요 (차감은 음수).")
      return
    }
    setExpBusyUid(uid)
    setError(null)
    setMessage(null)
    try {
      const result = await adjustMemberExp(uid, amount, expReasonInputs[uid])
      setMessage(`EXP ${amount > 0 ? "충전" : "차감"} 완료 (변경 후 잔액: ${result.exp.toLocaleString()} EXP)`)
      setExpInputs((prev) => ({ ...prev, [uid]: "" }))
      setExpReasonInputs((prev) => ({ ...prev, [uid]: "" }))
      loadMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "EXP 조정에 실패했습니다.")
    } finally {
      setExpBusyUid(null)
    }
  }

  const filteredMembers = members?.filter((m) => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return true
    return (m.email ?? "").toLowerCase().includes(q) || (m.displayName ?? "").toLowerCase().includes(q)
  }) ?? []

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

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-medium">
            전체 회원 조회 및 EXP 충전 ({filteredMembers.length}
            {memberSearch ? ` / ${members?.length ?? 0}` : ""})
          </h3>
          <input
            type="text"
            placeholder="이메일 또는 닉네임 검색"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-56 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {members === null ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground">해당하는 회원이 없습니다.</p>
          ) : null}
          {filteredMembers.map((member) => (
            <div
              key={member.uid}
              className="flex flex-col gap-2 rounded-md border border-border/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{member.displayName ?? member.email}</span>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                  {member.adminLevel ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {LEVEL_LABEL[member.adminLevel]}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  ZP {member.points.toLocaleString()} · EXP{" "}
                  <span className="font-semibold text-primary">{member.exp.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="number"
                  placeholder="±EXP"
                  value={expInputs[member.uid] ?? ""}
                  onChange={(e) => setExpInputs((prev) => ({ ...prev, [member.uid]: e.target.value }))}
                  className="w-24 rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="사유 (선택)"
                  value={expReasonInputs[member.uid] ?? ""}
                  onChange={(e) => setExpReasonInputs((prev) => ({ ...prev, [member.uid]: e.target.value }))}
                  className="w-32 rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs"
                />
                <Button
                  size="sm"
                  disabled={expBusyUid === member.uid}
                  onClick={() => handleAdjustExp(member.uid)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {expBusyUid === member.uid ? "처리 중..." : "적용"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
