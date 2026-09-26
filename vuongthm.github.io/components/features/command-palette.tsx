"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react"
import { useRouter } from "next/navigation"
import Fuse from "fuse.js"
import { Bookmark, BookOpen, FileText, Hash, Home, Images, Search, User, Users } from "lucide-react"
import { getAllTags, getVisibleNotes, getVisibleSeries, type Lang } from "@/lib/data"
import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Ctrl/Cmd+K command palette.
 *
 * It supersedes the old standalone `search-modal`, which was never mounted: the
 * header field and this palette read from the same selectors, so keeping two
 * implementations only meant two places to fix. The header keeps its compact
 * inline field for typing without leaving the page; the palette is the
 * keyboard-first surface for jumping anywhere.
 *
 * Content rules (same as the RSS feed):
 *   - Navigation, stories, notes and tags only, from the public selectors, with
 *     `isLocked` items filtered out.
 *   - No article bodies, so nothing private can surface here.
 *
 * Surface rules: this is a modal overlay, not a dock, so it is the one fixed
 * layer allowed above `FloatDock` (`z-50` against `z-40`). It renders no `<a>`:
 * selection goes through `router.push`, and the href carries the locale segment.
 *
 * Escape coordination: the listener below is registered in the capture phase so
 * it runs before FloatDock's bubble-phase handler and stops propagation.
 * Without that, closing the palette would also drop focus mode.
 */

type Group = "nav" | "story" | "note" | "tag"

interface PaletteItem {
  id: string
  group: Group
  label: string
  hint?: string
  href: string
  icon: ElementType
  keywords?: string[]
}

const LABELS: Record<
  Lang,
  {
    placeholder: string
    trigger: string
    noResults: string
    nav: string
    stories: string
    notes: string
    tags: string
    help: string
  }
> = {
  en: {
    placeholder: "Jump to a page, story, note or tag…",
    trigger: "Search",
    noResults: "Nothing matches that.",
    nav: "Go to",
    stories: "Stories",
    notes: "Notes",
    tags: "Tags",
    help: "↑↓ move · ↵ open · esc close",
  },
  vi: {
    placeholder: "Tới trang, chuyện kể, ghi chú hoặc thẻ…",
    trigger: "Tìm kiếm",
    noResults: "Không tìm thấy kết quả.",
    nav: "Tới",
    stories: "Chuyện kể",
    notes: "Ghi chú",
    tags: "Thẻ",
    help: "↑↓ di chuyển · ↵ mở · esc đóng",
  },
}

/** Locale-aware navigation commands. Every href carries the locale segment. */
function buildCommands(lang: Lang): PaletteItem[] {
  const base = `/${lang}`

  const commands: Array<{
    id: string
    label: Record<Lang, string>
    path: string
    icon: ElementType
    keywords: string[]
  }> = [
    {
      id: "home",
      label: { en: "Home", vi: "Trang chủ" },
      path: "/",
      icon: Home,
      keywords: ["home", "index", "start"],
    },
    {
      id: "stories",
      label: { en: "Stories", vi: "Chuyện kể" },
      path: "/stories/",
      icon: BookOpen,
      keywords: ["stories", "chapters", "truyen"],
    },
    {
      id: "notes",
      label: { en: "Notes", vi: "Ghi chú" },
      path: "/notes/",
      icon: FileText,
      keywords: ["notes", "writing", "bai viet"],
    },
    {
      id: "tags",
      label: { en: "Tags", vi: "Thẻ" },
      path: "/tags/",
      icon: Hash,
      keywords: ["tags", "topics"],
    },
    {
      id: "saved",
      label: { en: "Saved", vi: "Đã lưu" },
      path: "/saved/",
      icon: Bookmark,
      keywords: ["saved", "bookmarks", "library", "da luu"],
    },
    {
      id: "about",
      label: { en: "About", vi: "Giới thiệu" },
      path: "/about/",
      icon: User,
      keywords: ["about", "profile", "cv"],
    },
    {
      id: "people",
      label: { en: "People", vi: "Mọi người" },
      path: "/about/people/",
      icon: Users,
      keywords: ["people", "friends", "family", "ban be"],
    },
    {
      id: "album",
      label: { en: "Album", vi: "Album ảnh" },
      path: "/my-album/",
      icon: Images,
      keywords: ["album", "photos", "gallery", "anh"],
    },
  ]

  return commands.map((command) => ({
    id: `nav-${command.id}`,
    group: "nav" as const,
    label: command.label[lang],
    href: `${base}${command.path}`,
    icon: command.icon,
    keywords: command.keywords,
  }))
}

/** Public stories, notes and tags, ready to be searched. */
function buildContent(lang: Lang): PaletteItem[] {
  const base = `/${lang}`

  const stories = getVisibleSeries(lang)
    .filter((series) => !series.isLocked)
    .map<PaletteItem>((series) => ({
      id: `story-${series.slug}`,
      group: "story",
      label: series.title,
      hint: series.description,
      href: `${base}/stories/${series.slug}/`,
      icon: BookOpen,
      keywords: series.tags,
    }))

  const notes = getVisibleNotes(lang)
    .filter((note) => !note.isLocked)
    .map<PaletteItem>((note) => ({
      id: `note-${note.slug}`,
      group: "note",
      label: note.title,
      hint: note.description,
      href: `${base}/notes/${note.slug}/`,
      icon: FileText,
      keywords: note.tags,
    }))

  // Tag labels can carry non-ASCII characters, so the segment is encoded.
  const tags = getAllTags(lang).map<PaletteItem>((info) => ({
    id: `tag-${info.tag}`,
    group: "tag",
    label: info.tag,
    hint: String(info.count),
    href: `${base}/tags/${encodeURIComponent(info.tag)}/`,
    icon: Hash,
  }))

  return [...stories, ...notes, ...tags]
}

const GROUP_ORDER: Group[] = ["nav", "story", "note", "tag"]

/**
 * Event that an inline pill fires to ask the global instance to open. A window
 * event keeps the two instances decoupled, so neither needs to know where the
 * other is mounted.
 */
const OPEN_EVENT = "open-command-palette"


export function CommandPalette({
  lang,
  mode = "global",
}: {
  lang: Lang
  /**
   * "global" mounts once per layout: it owns the shortcut, the dialog and the
   * open event listener.
   * "inline" renders only the visible pill (a hero or toolbar), and asks the
   * global instance to open through an event. Keeping one owner prevents two
   * instances from both toggling on the same keypress.
   */
  mode?: "global" | "inline"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())

  const L = LABELS[lang]

  // Built once per locale: the data is static, so re-filtering on every
  // keystroke would be wasted work on a slow machine. The inline instance never
  // opens the dialog, so it skips the index entirely.
  const index = useMemo(() => {
    if (mode !== "global") {
      const empty: PaletteItem[] = []
      return { commands: empty, items: empty, fuse: new Fuse(empty, { keys: ["label"] }) }
    }

    const commands = buildCommands(lang)
    const items = [...commands, ...buildContent(lang)]

    const fuse = new Fuse(items, {
      keys: [
        { name: "label", weight: 2 },
        { name: "keywords", weight: 1.5 },
        { name: "hint", weight: 1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    })

    return { commands, items, fuse }
  }, [lang, mode])

  const trimmed = query.trim()
  const results = useMemo(() => {
    // With an empty query: navigation first, then the first few content items,
    // which is what a reader usually wants one keypress away.
    const found: PaletteItem[] = trimmed
      ? index.fuse.search(trimmed, { limit: 14 }).map((match) => match.item)
      : [...index.commands, ...index.items.filter((item) => item.group !== "nav").slice(0, 8)]

    return GROUP_ORDER.flatMap((group) => found.filter((item) => item.group === group))
  }, [trimmed, index])

  const active = results[activeIndex]

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
  }, [])

  const activate = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return
      close()
      router.push(item.href)
    },
    [close, router],
  )

  // Ctrl/Cmd+K toggles from anywhere, including while typing in the header.
  // Only the global instance listens; otherwise an inline pill on the same page
  // would open and close the dialog on one keypress.
  useEffect(() => {
    if (mode !== "global" || !siteConfig.features.commandPalette) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return
      event.preventDefault()
      setOpen((value) => !value)
      setQuery("")
      setActiveIndex(0)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mode])

  // Inline pills ask the global instance to open instead of owning a second
  // copy of the dialog.
  useEffect(() => {
    if (mode !== "global") return

    const onOpenRequest = () => {
      setOpen(true)
      setQuery("")
      setActiveIndex(0)
    }

    window.addEventListener(OPEN_EVENT, onOpenRequest)
    return () => window.removeEventListener(OPEN_EVENT, onOpenRequest)
  }, [mode])

  // Capture phase: this must win over FloatDock's Esc, which would otherwise
  // exit focus mode at the same time.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      close()
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [open, close])

  // While open: freeze the page behind and remember where focus came from, so
  // closing returns the reader to the control they used.
  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    inputRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  // Keep the highlighted row inside the scrollable list during arrow travel.
  useEffect(() => {
    if (!open || !active) return
    itemRefs.current.get(active.id)?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  if (!siteConfig.features.commandPalette) return null

  const move = (delta: number) => {
    if (results.length === 0) return
    setActiveIndex((current) => (current + delta + results.length) % results.length)
  }

  /** Group heading for the first row of each group. */
  const groupHeading: Record<Group, string> = {
    nav: L.nav,
    story: L.stories,
    note: L.notes,
    tag: L.tags,
  }

  // The visible affordance. A shortcut nobody can see is a shortcut nobody uses.
  const pill = (
    <button
      type="button"
      data-no-print
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={cn(
        "tap-target inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5",
        "text-small text-muted-foreground transition-colors duration-150",
        "hover:border-border-strong hover:text-foreground",
      )}
    >
      <Search size={13} aria-hidden="true" />
      <span>{L.trigger}</span>
      <kbd className="rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  )

  // The inline instance is only the affordance; the dialog belongs to the global
  // one, so a page can show the pill without mounting a second dialog.
  if (mode === "inline") return pill

  if (!open) return null

  return (
    <div
      data-no-print
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
    >
          {/* Backdrop: opacity is the only animated property. */}
          <div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] motion-safe:animate-[fade-in_120ms_ease-out]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={L.placeholder}
            className={cn(
              "relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden",
              "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--elevation-3)]",
              "motion-safe:animate-[palette-in_140ms_ease-out]",
            )}
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search size={15} aria-hidden="true" className="shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    move(1)
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    move(-1)
                  } else if (event.key === "Enter") {
                    event.preventDefault()
                    activate(active)
                  }
                }}
                placeholder={L.placeholder}
                aria-label={L.placeholder}
                aria-controls="command-palette-results"
                aria-activedescendant={active ? `palette-item-${active.id}` : undefined}
                autoComplete="off"
                className="h-12 w-full bg-transparent text-body outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>

            <div
              id="command-palette-results"
              role="listbox"
              aria-label={L.placeholder}
              className="overflow-y-auto overscroll-contain p-2"
            >
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-small text-muted-foreground">
                  {L.noResults}
                </p>
              ) : null}


              {results.map((item, position) => {
                const Icon: any = item.icon
                const isActive = position === activeIndex
                const previous = results[position - 1]
                const startsGroup = !previous || previous.group !== item.group

                return (
                  <div key={item.id}>
                    {startsGroup ? (
                      <div className="px-3 pt-3 pb-1 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                        {groupHeading[item.group]}
                      </div>
                    ) : null}
                    <button
                      id={`palette-item-${item.id}`}
                      ref={(element) => {
                        if (element) itemRefs.current.set(item.id, element)
                        else itemRefs.current.delete(item.id)
                      }}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(position)}
                      onClick={() => activate(item)}
                      className={cn(
                        "tap-target flex w-full items-center gap-3 rounded-[var(--radius)] px-3 text-left",
                        isActive && "bg-accent-brand/10",
                      )}
                    >
                      <Icon
                        size={15}
                        aria-hidden="true"
                        className={cn(
                          "shrink-0",
                          isActive ? "text-accent-brand" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-medium">{item.label}</span>
                        {item.hint ? (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>

            <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
              {L.help}
            </p>
          </div>
    </div>
  )
}
