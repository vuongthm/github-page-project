"use client"

import { useState } from "react"
import { ChevronDown, List } from "lucide-react"
import { useScrollSpy } from "@/lib/use-scroll-spy"
import { scrollToId } from "@/lib/scroll-store"
import type { TocItem } from "@/components/features/table-of-contents"
import type { Lang } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Eyebrow } from "@/components/ui/eyebrow"

/**
 * In-flow table of contents with scroll-spy.
 *
 * It renders in the document rather than as a floating panel: a fixed TOC button
 * was removed in Phase 2 because the float dock is the only allowed fixed
 * surface, and an in-flow list also reads better on a phone because it does not
 * cover the text.
 *
 * Collapsed by default on small screens, always open from `sm` up. Jumps go
 * through `scrollToId`, which offsets for the sticky header and updates the hash
 * without the browser jumping first.
 */

const LABEL: Record<Lang, { title: string; show: string }> = {
  en: { title: "On this page", show: "Show contents" },
  vi: { title: "Trong bài này", show: "Xem mục lục" },
}

export function TableOfContents({
  items,
  lang,
  className,
}: {
  items: TocItem[]
  lang: Lang
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const activeId = useScrollSpy(items.map((item) => item.id))

  if (items.length < 2) return null

  const L = LABEL[lang]

  return (
    <nav
      aria-label={L.title}
      className={cn(
        "mb-8 rounded-[var(--radius-lg)] border border-border bg-surface-sunken/60",
        className,
      )}
    >
      {/* On small screens the list is collapsed, so the article stays the first
          thing the reader sees. From `sm` it is always expanded. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left sm:pointer-events-none sm:cursor-default"
      >
        <Eyebrow className="flex items-center gap-2">
          <List size={12} className="text-accent-brand" />
          {L.title}
        </Eyebrow>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            "text-muted-foreground transition-transform duration-200 sm:hidden",
            open && "rotate-180",
          )}
        />
      </button>

      <ol
        className={cn(
          "flex-col gap-0.5 px-4 pb-4 sm:flex",
          open ? "flex" : "hidden",
        )}
      >
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}>
              <button
                type="button"
                onClick={() => scrollToId(item.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "tap-target flex w-full items-center rounded-[var(--radius)] px-2 text-left text-small transition-colors duration-150",
                  active
                    ? "bg-accent-brand/10 font-medium text-accent-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.text}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
