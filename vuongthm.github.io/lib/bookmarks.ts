import type { Lang } from "@/lib/data"

/**
 * Bookmark list.
 *
 * One array in `localStorage`, newest first. Entries carry only what the
 * `/saved` list needs to render a link — path, title, locale — so nothing
 * decrypted is ever written back to storage.
 *
 * Reads are validated instead of cast: `localStorage` is user-editable, so a
 * corrupted value must degrade to an empty list rather than throw during render.
 * A cap keeps a runaway list from filling the quota.
 */

const STORAGE_KEY = "vuong:bookmarks"

/** Well above any realistic reading list, low enough to stay tiny. */
const MAX_ENTRIES = 50

export interface BookmarkEntry {
  /** Pathname as visited, including the locale segment. */
  href: string
  title: string
  lang: Lang
  /** Epoch milliseconds, used for ordering only. */
  at: number
}

export interface BookmarkInput {
  href: string
  title: string
  lang: Lang
}

function isEntry(value: unknown): value is BookmarkEntry {
  if (typeof value !== "object" || value === null) return false
  const entry = value as Record<string, unknown>

  return (
    typeof entry.href === "string" &&
    entry.href.startsWith("/") &&
    typeof entry.title === "string" &&
    (entry.lang === "en" || entry.lang === "vi") &&
    typeof entry.at === "number"
  )
}

/** All valid entries, newest first. Empty in SSR, in private mode, or on junk. */
export function readBookmarks(): BookmarkEntry[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isEntry).sort((a, b) => b.at - a.at)
  } catch {
    // Disabled storage (Safari private mode) or a value that is not JSON.
    return []
  }
}

function write(entries: BookmarkEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // Quota or disabled storage: a convenience feature should never break the
    // page the reader is on.
  }
}

export function isBookmarked(href: string): boolean {
  return readBookmarks().some((entry) => entry.href === href)
}

/**
 * Adds the entry, or removes it when it is already saved.
 *
 * @returns true when the entry is now saved, false when it was removed. The
 * caller uses the return value to update the toggle without a second read.
 */
export function toggleBookmark(input: BookmarkInput): boolean {
  if (typeof window === "undefined") return false

  const entries = readBookmarks()
  const existing = entries.findIndex((entry) => entry.href === input.href)

  if (existing >= 0) {
    write(entries.filter((_, index) => index !== existing))
    return false
  }

  write([{ ...input, at: Date.now() }, ...entries])
  return true
}

export function removeBookmark(href: string): BookmarkEntry[] {
  if (typeof window === "undefined") return []

  const remaining = readBookmarks().filter((entry) => entry.href !== href)
  write(remaining)
  return remaining
}
