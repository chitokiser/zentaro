"use client"

import Link from "next/link"
import { Lock } from "lucide-react"

interface MemberFeatureLockProps {
    title: string
    description: string
    nextPath: string
}

/** Shared lock placeholder for Research Lab interactive tools (mix preview,
 * balance recommender, AI Virtual Research Lab) that are gated to members —
 * browsing/search stays public, but these compute-driven features don't. */
export function MemberFeatureLock({ title, description, nextPath }: MemberFeatureLockProps) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="font-serif text-lg font-semibold text-slate-50">{title}</p>
            <p className="max-w-sm text-sm text-slate-400">{description}</p>
            <Link
                href={`/my/profile?next=${encodeURIComponent(nextPath)}`}
                className="mt-2 inline-block rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
            >
                회원가입 / 로그인하기
            </Link>
        </div>
    )
}
