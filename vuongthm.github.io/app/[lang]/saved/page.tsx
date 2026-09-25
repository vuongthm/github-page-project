"use client"

import { use, useEffect, useState } from "react"
import { ArrowRight, Bookmark, Trash2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { readBookmarks, removeBookmark, type BookmarkEntry } from "@/lib/bookmarks"
import { siteConfig } from "@/lib/site.config"
import type { Lang } from "@/lib/data"

/**
 * Saved items.
 *
 * A client page in the same shape as `/notes` and `/stories`: it renders its own
 * `<Header />` and `<Footer />`, and reads `lang` through `use(params)` because a
 * client component cannot be async.
 *
 * The list renders only after mount, and only for the current locale. The values
 * live in `localStorage`, which the server cannot see, so rendering them during
 * hydration would be a mismatch; filtering by locale keeps an English list from
 * leaking into the Vietnamese page.
 */

const LABELS: Record<
  Lang,
  { eyebrow: string; title: string; description: string; empty: string; emptyHint: string; remove: string }
> = {
  en: {
    eyebrow: "Library",
    title: "Saved",
    description: "Chapters and notes you kept for later. Stored in this browser only.",
    empty: "Nothing saved yet.",
    emptyHint: "Open a chapter or note and use the bookmark button in the reading dock.",
    remove: "Remove from saved",
  },
  vi: {
    eyebrow: "Tủ sách",
    title: "Đã lưu",
    description: "Chương và ghi chú bạn để dành. Chỉ lưu trong trình duyệt này.",
    empty: "Chưa lưu gì.",
    emptyHint: "Mở một chương hoặc ghi chú rồi dùng nút đánh dấu ở thanh đọc.",
    remove: "Bỏ khỏi danh sách lưu",
  },
}

export default function SavedPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = use(params)
  const [mounted, setMounted] = useState(false)
  const [entries, setEntries] = useState<BookmarkEntry[]>([])

  useEffect(() => {
    setMounted(true)
    setEntries(readBookmarks())
  }, [])

  const L = LABELS[lang]
  // `ui/link` prepends the locale, so the stored absolute path is trimmed first.
  const prefix = `/${lang}`
  const visible = mounted ? entries.filter((entry) => entry.lang === lang) : []

  return (
    <>
      <Header />

      <Container className="pt-12 pb-8">
        {/* A page title is an `<h1>`: list pages here render their own heading
            rather than routing through SectionHeading, which is h2/h3 by design. */}
        <Eyebrow tone="brand">{L.eyebrow}</Eyebrow>
        <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
          {L.title}
        </h1>
        <p className="max-w-xl text-pretty text-small text-muted-foreground">{L.description}</p>
      </Container>

      <Container className="pb-[var(--space-section)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-16 text-center">
            <Bookmark size={20} aria-hidden="true" className="text-muted-foreground" />
            <p className="text-body font-medium text-foreground">{L.empty}</p>
            <p className="max-w-sm text-small text-muted-foreground">{L.emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border">
            {visible.map((entry) => {
              const relativeHref = entry.href.startsWith(prefix)
                ? entry.href.slice(prefix.length)
                : entry.href

              return (
                <li key={entry.href} className="flex items-center gap-2 p-2 pl-4">
                  <Link
                    href={relativeHref}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius)] py-3 text-left transition-colors duration-150"
                  >
                    <span className="min-w-0 flex-1 truncate text-body text-foreground">
                      {entry.title}
                    </span>
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEntries(removeBookmark(entry.href))}
                    aria-label={`${L.remove}: ${entry.title}`}
                    title={L.remove}
                    className="tap-target flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Container>

      <Footer lang={lang} />
    </>
  )
}
