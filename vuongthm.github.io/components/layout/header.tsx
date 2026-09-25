"use client"

import { Link } from "@/components/ui/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Sun, Moon, Search, Menu, X, Hash } from "lucide-react"
import { useTheme } from "next-themes"
import { useLang } from "@/components/providers/lang-provider"
import { cn } from "@/lib/utils"
import { BrandLockup } from "@/components/brand/logo"
import Fuse from "fuse.js"
import { useScrolled } from "@/lib/scroll-store"
import {
  getVisibleSeries,
  getVisibleNotes,
  getAllTags,
  type Series,
  type Note,
} from "@/lib/data"

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "stories", href: "/stories" },
  { key: "notes", href: "/notes" },
  { key: "tags", href: "/tags" },
  { key: "about", href: "/about" },
] as const

const NAV_LABELS: Record<string, { en: string; vi: string }> = {
  home: { en: "Home", vi: "Trang chủ" },
  stories: { en: "Stories", vi: "Chuyện kể" },
  notes: { en: "Notes", vi: "Ghi chú" },
  tags: { en: "Tags", vi: "Thẻ" },
  about: { en: "About", vi: "Về tôi" },
}

type SearchResult =
  | { type: "story"; item: Series }
  | { type: "note"; item: Note }
  | { type: "tag"; item: { tag: string; count: number } }

const SEARCH_LABELS = {
  en: {
    placeholder: "Search posts, stories, tags… or #tag",
    noResults: "No results found.",
    stories: "Stories",
    notes: "Notes",
    tags: "Tags",
  },
  vi: {
    placeholder: "Tìm kiếm bài viết, chuyện kể… hoặc #thẻ",
    noResults: "Không tìm thấy kết quả.",
    stories: "Chuyện kể",
    notes: "Ghi chú",
    tags: "Thẻ",
  },
}

/**
 * Shared chrome for the header's icon buttons.
 *
 * The same long class string used to be copied into four buttons, which is how
 * they drifted apart in size and hover treatment. 44 px on touch, 36 px on
 * pointer devices.
 */
const ICON_BUTTON =
  "inline-flex items-center justify-center size-11 md:size-9 rounded-lg text-muted-foreground " +
  "transition-colors duration-150 hover:text-foreground hover:bg-muted cursor-pointer"

interface HeaderProps {
  onSearchOpen?: () => void
}

export function Header({ onSearchOpen: _unused }: HeaderProps) {
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [mounted, setMounted] = useState(false)
  // Shared rAF-throttled store. The header used to own its own scroll listener
  // that called setState on every event; now one listener serves the header,
  const scrolled = useScrolled()

  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)

  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Search indices.
  //
  // Building a Fuse index walks every story, note and tag. These three
  // constructors used to run on *every render*, so each keystroke and each
  // scroll-driven re-render re-indexed the whole site. Memoising them on `lang`
  // means the work happens once per language switch.
  const { storyFuse, noteFuse, tagFuse, tagItems } = useMemo(() => {
    const tags = getAllTags(lang)
    return {
      tagItems: tags,
      storyFuse: new Fuse(getVisibleSeries(lang), {
        keys: ["title", "description", "tags"],
        threshold: 0.35,
      }),
      noteFuse: new Fuse(getVisibleNotes(lang), {
        keys: ["title", "description", "tags"],
        threshold: 0.35,
      }),
      tagFuse: new Fuse(tags, { keys: ["tag"], threshold: 0.3 }),
    }
  }, [lang])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = () => setMobileOpen(false)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: MouseEvent) => {
      if (
        mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node) &&
        mobileButtonRef.current && !mobileButtonRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [mobileOpen])

  // Declared *before* the effects below. A `const` arrow function referenced by
  // an effect declared earlier in the same component closes over a binding that
  // is recreated every render, which is what the React lint rules flag as
  // "accessed before it is declared".
  const collapseSearch = useCallback(() => {
    setSearchExpanded(false)
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }, [])

  useEffect(() => {
    if (!searchExpanded) return
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        collapseSearch()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [searchExpanded, collapseSearch])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (searchExpanded) collapseSearch()
        else if (mobileOpen) setMobileOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [searchExpanded, mobileOpen, collapseSearch])

  const openSearch = () => {
    setSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 80)
  }

  const handleSearchInput = (value: string) => {
    // Fixed: change setQuery to setSearchQuery to match declared React state hook
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      if (value.trim().startsWith("#")) {
        const tagQ = value.trim().slice(1).toLowerCase()
        const matched = tagItems.filter((t) => t.tag.toLowerCase().includes(tagQ))
        setSearchResults(
          matched.slice(0, 6).map((t) => ({ type: "tag" as const, item: t }))
        )
      } else {
        const stories = storyFuse.search(value).slice(0, 3).map((r) => ({ type: "story" as const, item: r.item }))
        const notes = noteFuse.search(value).slice(0, 4).map((r) => ({ type: "note" as const, item: r.item }))
        const tags = tagFuse.search(value).slice(0, 3).map((r) => ({ type: "tag" as const, item: r.item }))
        setSearchResults([...stories, ...notes, ...tags])
      }
      setShowResults(true)
    }, 180)
  }

  const isNavActive = (href: string) => {
    if (!pathname) return false
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, "") || "/"
    return href === "/" ? cleanPath === "/" : cleanPath.startsWith(href)
  }

  const SL = SEARCH_LABELS[lang]
  const storyResults = searchResults.filter((r) => r.type === "story") as { type: "story"; item: Series }[]
  const noteResults  = searchResults.filter((r) => r.type === "note")  as { type: "note";  item: Note }[]
  const tagResults   = searchResults.filter((r) => r.type === "tag")   as { type: "tag";   item: { tag: string; count: number } }[]
  const hasResults   = searchResults.length > 0

  return (
    <header
      data-reading-chrome
      className={cn(
        "fixed top-0 left-0 right-0 z-[90] transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300",
        scrolled
          ? "frosted header-fade-bottom border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 rounded-lg transition-opacity duration-150 hover:opacity-80"
          aria-label="Vuong — home"
        >
          <BrandLockup />
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isNavActive(href)
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1.5 text-small font-medium transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {NAV_LABELS[key][lang]}
                {/* Animated underline; grows from the left on the active item. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent-brand",
                    "transition-transform duration-200 ease-out",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <div ref={searchContainerRef} className="relative flex items-center">
            {searchExpanded ? (
              <div className="flex items-center">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder={SL.placeholder}
                    className="h-8 pl-7 pr-7 w-48 sm:w-72 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted-foreground text-[11px] outline-none focus:ring-2 focus:ring-accent-brand/30 focus:border-accent-brand/60 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200"
                    aria-label="Search"
                    aria-expanded={showResults && hasResults}
                    aria-haspopup="listbox"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                        setShowResults(false)
                        searchInputRef.current?.focus()
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X size={11} />
                    </button>
                  )}

                  {/* BẢNG KẾT QUẢ TÌM KIẾM */}
                  {showResults && hasResults && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 w-full bg-surface border border-border rounded-[var(--radius-lg)] shadow-xl z-[200] overflow-hidden"
                      role="listbox"
                      aria-label="Search results"
                    >
                      {storyResults.length > 0 && (
                        <div>
                          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {SL.stories}
                          </p>
                          {storyResults.map(({ item }) => (
                            <Link
                              key={item.slug}
                              href={`/stories/${item.slug}`}
                              onClick={collapseSearch}
                              role="option"
                              className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
                            >
                              <Search size={11} className="shrink-0 text-muted-foreground" />
                              <span className="truncate">{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {noteResults.length > 0 && (
                        <div className={storyResults.length > 0 ? "border-t border-border" : ""}>
                          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {SL.notes}
                          </p>
                          {noteResults.map(({ item }) => (
                            <Link
                              key={item.slug}
                              href={`/notes/${item.slug}`}
                              onClick={collapseSearch}
                              role="option"
                              className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
                            >
                              <Search size={11} className="shrink-0 text-muted-foreground" />
                              <span className="truncate">{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {tagResults.length > 0 && (
                        <div className={(storyResults.length > 0 || noteResults.length > 0) ? "border-t border-border" : ""}>
                          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {SL.tags}
                          </p>
                          {tagResults.map(({ item }) => (
                            <Link
                              key={item.tag}
                              href={`/tags/${item.tag}`}
                              onClick={collapseSearch}
                              role="option"
                              className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-foreground hover:bg-muted transition-colors"
                            >
                              <Hash size={11} className="shrink-0 text-accent-brand" />
                              <span className="truncate">{item.tag}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* KHUNG THÔNG BÁO KHÔNG CÓ KẾT QUẢ TÌM KIẾM */}
                  {showResults && !hasResults && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 w-full bg-surface border border-border rounded-[var(--radius-lg)] shadow-xl z-[200] px-3 py-4">
                      <p className="text-[11px] text-muted-foreground text-center">{SL.noResults}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={openSearch} aria-label="Open search" className={ICON_BUTTON}>
                <Search size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setLang(lang === "en" ? "vi" : "en")}
            aria-label={`Switch to ${lang === "en" ? "Vietnamese" : "English"}`}
            className={cn(
              ICON_BUTTON,
              "hidden md:inline-flex font-mono text-eyebrow uppercase tracking-[0.14em]",
            )}
          >
            {lang === "en" ? "VI" : "EN"}
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              className={cn(ICON_BUTTON, "hidden md:inline-flex")}
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <div className="relative md:hidden">
            <button
              ref={mobileButtonRef}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-haspopup="menu"
              className={cn(
                ICON_BUTTON,
                "transition-[color,background-color,transform] duration-300",
                mobileOpen ? "rotate-90 text-foreground" : "rotate-0",
              )}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div
              ref={mobileMenuRef}
              role="menu"
              aria-label="Mobile navigation"
              className={cn(
                // Solid surface rather than the blurred glass used elsewhere:
                // a backdrop-filter behind a menu costs a full-screen repaint
                // every frame it animates.
                "absolute top-full right-0 z-[200] mt-2 w-60 overflow-hidden rounded-[var(--radius-lg)]",
                "border border-border bg-surface p-1.5 shadow-lg",
                "origin-top-right transition-[opacity,transform] duration-200 ease-out",
                mobileOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
              )}
            >
              {NAV_LINKS.map(({ key, href }) => {
                const active = isNavActive(href)
                return (
                  <Link
                    key={key}
                    href={href}
                    role="menuitem"
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center min-h-11 rounded-lg px-3.5 text-body font-medium",
                      "transition-colors duration-150",
                      active
                        ? "bg-accent-brand/10 text-accent-brand"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {NAV_LABELS[key][lang]}
                  </Link>
                )
              })}

              {/* Language and theme live here on a phone: at 360 px the top bar
                  only has room for search and the menu button. */}
              <div className="mt-1.5 flex items-stretch gap-1 border-t border-border pt-1.5">
                <button
                  onClick={() => {
                    setLang(lang === "en" ? "vi" : "en")
                    setMobileOpen(false)
                  }}
                  aria-label={`Switch to ${lang === "en" ? "Vietnamese" : "English"}`}
                  className={cn(
                    ICON_BUTTON,
                    "w-full font-mono text-eyebrow uppercase tracking-[0.14em]",
                  )}
                >
                  {lang === "en" ? "Tiếng Việt" : "English"}
                </button>

                {mounted && (
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                    className={cn(ICON_BUTTON, "w-full")}
                  >
                    {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}