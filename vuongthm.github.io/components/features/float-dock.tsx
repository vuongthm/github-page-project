"use client"

import { useCallback, useEffect, useState, type ElementType } from "react"
import { usePathname } from "next/navigation"
import {
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Focus as FocusIcon,
  Minus,
  Plus,
  Sparkles,
  Type,
} from "lucide-react"
import { useReading } from "@/components/providers/reading-provider"
import { scrollToTop, useScrollMetrics } from "@/lib/scroll-store"
import { siteConfig } from "@/lib/site.config"
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/data"

/**
 * The single floating control surface for the whole site.
 *
 * Nothing else may render a `position: fixed` control. Before this existed the
 * positioning themselves independently, which is how they ended up overlapping
 * on small screens and drifting apart in style.
 *
 * Controls are declared as data (the `actions` array), so adding one is an entry
 * here rather than another fixed element somewhere else.
 */

type PageKind = "reading" | "other"

/**
 * Which kind of page this is, derived from the pathname.
 *
 * Deriving it here keeps the dock a single mounted component instead of asking
 * every detail page to opt in through context.
 *   /en/stories/<series>/<chapter>/  -> reading
 *   /en/notes/<slug>/                -> reading
 */
function pageKind(pathname: string | null): PageKind {
  if (!pathname) return "other"
  const parts = pathname.split("/").filter(Boolean)
  // parts[0] is the locale.
  if (parts[1] === "stories" && parts.length === 4) return "reading"
  if (parts[1] === "notes" && parts.length === 3) return "reading"
  return "other"
}

const LABELS: Record<
  Lang,
  {
    backToTop: string
    readingTools: string
    smaller: string
    larger: string
    focus: string
    exitFocus: string
    askAi: string
    save: string
    unsave: string
  }
> = {
  en: {
    backToTop: "Back to top",
    readingTools: "Reading tools",
    smaller: "Smaller text",
    larger: "Larger text",
    focus: "Focus mode",
    exitFocus: "Exit focus mode",
    askAi: "Ask AI about this page",
    save: "Save for later",
    unsave: "Remove from saved",
  },
  vi: {
    backToTop: "Lên đầu trang",
    readingTools: "Tuỳ chỉnh đọc",
    smaller: "Chữ nhỏ hơn",
    larger: "Chữ lớn hơn",
    focus: "Chế độ tập trung",
    exitFocus: "Thoát chế độ tập trung",
    askAi: "Hỏi AI về trang này",
    save: "Lưu để đọc sau",
    unsave: "Bỏ khỏi danh sách lưu",
  },
}

interface DockAction {
  id: string
  icon: ElementType
  label: string
  onClick: () => void
  visible: boolean
  active?: boolean
}

/** Shared chrome for a dock button: 44 px target, icon centred. */
const DOCK_BUTTON =
  "flex size-11 items-center justify-center rounded-full border border-border " +
  "bg-surface/95 text-muted-foreground shadow-[var(--elevation-2)] backdrop-blur-sm " +
  "transition-[color,background-color,border-color,transform] duration-150 " +
  "hover:text-foreground hover:border-border-strong " +
  "motion-safe:hover:-translate-y-0.5"

const TRAY_BUTTON =
  "flex size-9 items-center justify-center rounded-full text-muted-foreground " +
  "transition-colors duration-150 hover:bg-muted hover:text-foreground " +
  "disabled:opacity-35 disabled:hover:bg-transparent"

export function FloatDock({ lang }: { lang: Lang }) {
  const pathname = usePathname()
  const { y } = useScrollMetrics()
  const { prefs, enabled, increaseScale, decreaseScale, toggleFocus } = useReading()
  const [toolsOpen, setToolsOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const L = LABELS[lang]
  const kind = pageKind(pathname)

  // Escape always leaves focus mode, from anywhere on the page.
  useEffect(() => {
    if (!prefs.focus) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") toggleFocus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prefs.focus, toggleFocus])

  // Collapse the tray when focus mode opens: its own button is hidden then, so
  // leaving it mounted would strand an orphaned panel on screen.
  useEffect(() => {
    if (prefs.focus) setToolsOpen(false)
  }, [prefs.focus])

  const handleBackToTop = useCallback(() => scrollToTop(), [])

  /**
   * Saves or unsaves this page.
   *
   * The title comes from the page's own `<h1>`, matching the continue-reading
   * tracker: no data lookup is needed, and the stored label always matches what
   * the reader is looking at.
   */
  const handleToggleSaved = useCallback(() => {
    const heading = document.querySelector("h1")?.textContent?.trim() || document.title
    setSaved(
      toggleBookmark({
        href: pathname ?? "",
        title: heading.replace(/\s+/g, " "),
        lang,
      }),
    )
  }, [pathname, lang])

  /*
    Bookmark state for this page, read in an effect and never during render: the
    value lives in localStorage, which the server cannot see, so reading it while
    rendering would make the first client render disagree with the HTML.
  */
  useEffect(() => {
    if (!siteConfig.features.bookmarks) return
    setSaved(isBookmarked(pathname ?? ""))
  }, [pathname])

  /*
    Visibility rules, in priority order. Exit-focus is exclusive: while focus
    mode is on it is the only control shown, because every other action would
    either be unreadable or pull the reader out of the text.
  */
  const actions = (
    [
      {
        id: "exit-focus",
        icon: FocusIcon,
        label: L.exitFocus,
        onClick: toggleFocus,
        visible: prefs.focus,
        active: true,
      },
    {
      id: "saved",
      icon: saved ? BookmarkCheck : Bookmark,
      label: saved ? L.unsave : L.save,
      onClick: handleToggleSaved,
      // Only long-form pages are worth saving, and the dock stays short on
      // purpose: every entry here costs the reader a decision.
      visible: !prefs.focus && siteConfig.features.bookmarks && kind === "reading",
      active: saved,
    },
    {
      id: "reading-tools",
      icon: Type,
      label: L.readingTools,
      onClick: () => setToolsOpen((open) => !open),
      // Only chapter and note detail pages have adjustable reading text.
      visible: !prefs.focus && enabled && kind === "reading",
      active: toolsOpen,
    },
    {
      id: "ask-ai",
      icon: Sparkles,
      label: L.askAi,
      // Phase 5 supplies the panel. Gated on the flag plus a reading page; the
      // locked-content check belongs with the panel, which knows the page data.
      onClick: () => {},
      visible: !prefs.focus && siteConfig.features.aiAssistant && kind === "reading",
    },
    {
      icon: ArrowUp,
      label: L.backToTop,
      onClick: handleBackToTop,
      // 600 px rather than 300: the dock should not appear while the reader is
      // still inside the hero.
      visible: !prefs.focus && y > 600,
    },
    ] as DockAction[]
  ).filter((action) => action.visible)

  if (actions.length === 0) return null

  const toolsVisible = !prefs.focus && enabled && kind === "reading"

  return (
    <div
      data-no-print
      className={cn(
        "fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2",
        // Clear the home indicator and the notch.
        "pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]",
      )}
    >
      {/* Tool tray opens upward so it never covers the buttons below it. */}
      {toolsOpen && toolsVisible ? (
        <div
          role="group"
          aria-label={L.readingTools}
          className="flex flex-col items-center gap-0.5 rounded-full border border-border bg-surface/95 p-1 shadow-[var(--elevation-3)] backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={increaseScale}
            disabled={prefs.scale >= siteConfig.reading.maxScale}
            aria-label={L.larger}
            className={TRAY_BUTTON}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={decreaseScale}
            disabled={prefs.scale <= siteConfig.reading.minScale}
            aria-label={L.smaller}
            className={TRAY_BUTTON}
          >
            <Minus size={15} />
          </button>
          <span aria-hidden="true" className="my-0.5 h-px w-5 bg-border" />
          <button
            type="button"
            onClick={toggleFocus}
            aria-label={L.focus}
            className={TRAY_BUTTON}
          >
            <FocusIcon size={15} />
          </button>
        </div>
      ) : null}

      {actions.map(({ id, icon: Icon, label, onClick, active }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
          aria-pressed={active === undefined ? undefined : active}
          className={cn(DOCK_BUTTON, active && "border-accent-brand text-accent-brand")}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}

