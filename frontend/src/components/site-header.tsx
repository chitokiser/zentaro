"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Shield, ShoppingCart, User, Wallet } from "lucide-react"

import { MAIN_NAV } from "@/lib/nav"
import { getToken, fetchMe, fetchWallet, onAuthChanged, type Wallet as WalletData } from "@/lib/auth-client"
import { CartBadge } from "@/components/cart-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [wallet, setWallet] = React.useState<WalletData | null>(null)

  React.useEffect(() => {
    function refresh() {
      if (!getToken()) {
        setIsAdmin(false)
        setWallet(null)
        return
      }
      fetchMe()
        .then((me) => setIsAdmin(me.isAdmin))
        .catch(() => setIsAdmin(false))
      fetchWallet()
        .then(setWallet)
        .catch(() => setWallet(null))
    }
    refresh()
    return onAuthChanged(refresh)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/brand/logo.png"
            alt="ZENTARO"
            width={240}
            height={160}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((group) => (
            <DropdownMenu key={group.label}>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary hover:text-primary">
                  {group.label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 bg-card text-card-foreground"
              >
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.description ? (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <CartBadge />
          {wallet ? (
            <div className="mr-1 flex items-center gap-2.5 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">
                포인트 <span className="font-medium text-foreground">{wallet.rewardPoint.toLocaleString()}</span>
              </span>
              <span className="text-muted-foreground">
                AP <span className="font-medium text-primary">{wallet.ap.toLocaleString()}</span>
              </span>
              <span className="text-muted-foreground">
                EXP <span className="font-medium text-primary">{wallet.exp.toLocaleString()}</span>
              </span>
            </div>
          ) : null}
          {isAdmin ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-primary/50 text-primary hover:bg-secondary">
              <Link href="/admin">
                <Shield className="size-4" />
                관리자모드
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-foreground/90 hover:text-primary">
            <Link href="/my/wallet">
              <Wallet className="size-4" />
              My Wallet
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/my/profile">
              <User className="size-4" />
              로그인
            </Link>
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-display tracking-[0.2em] text-primary">
                ZENTARO
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-6">
              <Link
                href="/checkout"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-foreground/90 hover:bg-secondary hover:text-primary"
              >
                <ShoppingCart className="size-4" />
                장바구니
              </Link>
              {wallet ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    포인트 <span className="font-medium text-foreground">{wallet.rewardPoint.toLocaleString()}</span>
                  </span>
                  <span className="text-muted-foreground">
                    AP <span className="font-medium text-primary">{wallet.ap.toLocaleString()}</span>
                  </span>
                  <span className="text-muted-foreground">
                    EXP <span className="font-medium text-primary">{wallet.exp.toLocaleString()}</span>
                  </span>
                </div>
              ) : null}
              {MAIN_NAV.map((group) => (
                <div key={group.label} className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </span>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-secondary hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-primary/50 px-3 py-2 text-center text-sm font-medium text-primary"
                >
                  <Shield className="size-4" />
                  관리자모드
                </Link>
              ) : null}
              <Link
                href="/my/profile"
                onClick={() => setMobileOpen(false)}
                className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                로그인
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
