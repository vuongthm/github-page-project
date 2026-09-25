"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Clock, X } from "lucide-react"
import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { clearContinueEntry, readContinueEntry, type ContinueEntry } from "@/lib/continue-reading"
import { siteConfig } from "@/lib/site.config"
import type { Lang } from "@/lib/data"

/**
 * "Continue reading" row for the home page.
 *
 * Renders nothing on the server and nothing on the first client render, then
 * appears if a matching entry exists. That ordering is deliberate: the value
 * lives in `localStorage`, which the server cannot see, so rendering it during
 * hydration would produce a mismatch.
 *
 * The entry is only shown for the locale it was recorded in. `ui/link` prepends
 * the current locale, so the stored path is stored absolute and made relative
 * here — otherwise the segment would be added twice.
 */

const LABELS: Record<Lang, { title: string; dismiss: string }> = {
  en: { title: "Pick up where you left off", dismiss: "Forget this" },
  vi: { title: "Đọc tiếp chỗ đang dở", dismiss: "Quên mục này" },
}

export function ContinueReadingRow({ lang }: { lang: Lang }) {
  const [entry, setEntry] = useState<ContinueEntry | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setEntry(readContinueEntry())
  }, [])

  if (!siteConfig.features.continueReading) return null
  if (!mounted || !entry || entry.lang !== lang) return null

  const L = LABELS[lang]
  const prefix = `/${lang}`
  const relativeHref = entry.href.startsWith(prefix) ? entry.href.slice(prefix.length) : entry.href

  return (
    <Container className="pt-2">
      <div className="flex items-center gap-2">
        <Link
          href={relativeHref}
          className="group flex min-w-0 flex-1 items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-brand/10 text-accent-brand">
            <Clock size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow tone="brand">{L.title}</Eyebrow>
            <p className="mt-0.5 truncate text-body font-medium text-foreground">{entry.title}</p>
          </div>
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
          />
        </Link>
        <button
          type="button"
          onClick={() => {
            clearContinueEntry()
            setEntry(null)
          }}
          aria-label={L.dismiss}
          title={L.dismiss}
          className="tap-target flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </Container>
  )
}
