"use client"

import { useState } from "react"
import { PageHeader, Section } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/i18n-context"

const CONTRACT_ADDRESSES = [
  "0xdD98e6425f1fc7Ca536cd6bba9674f1E270cB30C", // Zentaro Token
  "0x9c20817B074DAe2298d07cAC587667214eA0DC01", // ZtaroVaultDAO
  "0x4720553Ca43AD5Dd3a784FF51edDF850B9e55093", // ZentaroBank
  "0x9cCe9d0737c5B0F7aC3c5B5a18D4d34897A2a8AD", // ZtroRewardDispenser
]

// Order matches CONTRACT_ADDRESSES / s.contracts above. Files live in
// frontend/public/contracts/, copied verbatim from backend/contract/.
const CONTRACT_FILES: { file: string; flattenedFile?: string }[] = [
  { file: "Zentaro.sol" },
  { file: "ZtaroVaultDAO.sol", flattenedFile: "ZtaroVaultDAO.flattened.sol" },
  { file: "ZentaroBank.sol" },
  { file: "ZtroRewardDispenser.sol" },
]

export default function SmartContractPage() {
  const { t } = useI18n()
  const s = t.about.smartContract
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [sourceCache, setSourceCache] = useState<Record<string, string>>({})
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)

  const toggleSource = async (idx: number, file: string) => {
    if (openIdx === idx) {
      setOpenIdx(null)
      return
    }
    setOpenIdx(idx)
    if (!sourceCache[file]) {
      setLoadingIdx(idx)
      try {
        const res = await fetch(`/contracts/${file}`)
        const text = await res.text()
        setSourceCache((prev) => ({ ...prev, [file]: text }))
      } catch {
        setSourceCache((prev) => ({ ...prev, [file]: "// failed to load source" }))
      } finally {
        setLoadingIdx(null)
      }
    }
  }

  return (
    <div>
      <PageHeader eyebrow={s.eyebrow} title={s.title} description={s.description} />

      <Section id="intro" title={s.introTitle}>
        <p>{s.introBody}</p>
      </Section>

      <Section id="disclaimer" title={s.disclaimerTitle} className="border-t border-border/60">
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-amber-700 dark:text-amber-400">
          {s.disclaimerBody}
        </p>
      </Section>

      <Section id="contracts" title={s.tableTitle} className="border-t border-border/60">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">{s.colName}</th>
                <th className="px-4 py-2 font-medium">{s.colAddress}</th>
                <th className="px-4 py-2 font-medium">{s.colPurpose}</th>
              </tr>
            </thead>
            <tbody>
              {s.contracts.map((c, idx) => (
                <tr key={c.name} className="border-t border-border/60">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`https://opbnbscan.com/address/${CONTRACT_ADDRESSES[idx]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="notranslate font-mono text-xs text-primary underline underline-offset-4"
                    >
                      {CONTRACT_ADDRESSES[idx].slice(0, 10)}…{CONTRACT_ADDRESSES[idx].slice(-8)}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{c.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="source" title={s.sourceTitle} className="border-t border-border/60">
        <p className="mb-4 text-sm text-muted-foreground">{s.sourceIntro}</p>
        <div className="flex flex-col gap-3">
          {s.contracts.map((c, idx) => {
            const meta = CONTRACT_FILES[idx]
            const isOpen = openIdx === idx
            return (
              <div key={c.name} className="overflow-hidden rounded-lg border border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary/40 px-4 py-3">
                  <span className="notranslate text-sm font-medium">{c.name}</span>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href={`/contracts/${meta.file}`}
                      download
                      className="text-primary underline underline-offset-4"
                    >
                      {s.downloadLabel}
                    </a>
                    {meta.flattenedFile ? (
                      <a
                        href={`/contracts/${meta.flattenedFile}`}
                        download
                        className="text-muted-foreground underline underline-offset-4"
                      >
                        {s.downloadFlattenedLabel}
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleSource(idx, meta.file)}
                      className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition hover:bg-secondary"
                    >
                      {isOpen ? s.hideSourceLabel : s.viewSourceLabel}
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="max-h-[480px] overflow-auto bg-zinc-950 p-4">
                    {loadingIdx === idx ? (
                      <p className="text-xs text-zinc-400">{s.loadingLabel}</p>
                    ) : (
                      <pre className="text-[11px] leading-relaxed text-zinc-300">
                        <code>{sourceCache[meta.file]}</code>
                      </pre>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </Section>

      <Section id="facts" title={s.factsTitle} className="border-t border-border/60">
        <ul className="list-disc space-y-2 pl-5">
          {s.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </Section>

      <Section id="verify-status" title={s.verifyStatusTitle} className="border-t border-border/60">
        <p>{s.verifyStatusBody}</p>
      </Section>
    </div>
  )
}
