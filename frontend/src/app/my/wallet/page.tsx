"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchWallet } from "@/lib/auth-client"

interface WalletData {
  ap: number
  exp: number
  timeToken: number
  jumpToken: number
  rewardPoint: number
  tickets: string[]
  nfts: string[]
}

const TILES: { key: keyof WalletData; label: string }[] = [
  { key: "ap", label: "AP (Reward Point)" },
  { key: "exp", label: "EXP (Mall 마진 결제)" },
  { key: "timeToken", label: "Time Token" },
  { key: "jumpToken", label: "Jump Token" },
  { key: "rewardPoint", label: "Bonus Reward Point" },
]

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWallet()
      .then((data) => setWallet(data))
      .catch((err) => setError(err instanceof Error ? err.message : "오류가 발생했습니다."))
  }, [])

  if (error) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        {error}{" "}
        <Link href="/my/profile" className="text-primary underline underline-offset-4">
          로그인 하러가기
        </Link>
      </div>
    )
  }

  if (!wallet) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map((tile) => (
          <div key={tile.key} className="rounded-lg border border-border/60 bg-card p-4">
            <span className="text-xs text-muted-foreground">{tile.label}</span>
            <p className="mt-1 font-display text-2xl font-semibold text-primary">
              {(wallet[tile.key] as number).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <h3 className="font-display text-sm font-medium text-foreground">Ticket</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {wallet.tickets.length > 0 ? `${wallet.tickets.length}개 보유` : "보유한 Ticket이 없습니다."}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <h3 className="font-display text-sm font-medium text-foreground">NFT</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {wallet.nfts.length > 0 ? `${wallet.nfts.length}개 보유` : "보유한 NFT가 없습니다."}
          </p>
        </div>
      </div>
    </div>
  )
}
