import type { Lang } from "@/lib/data"

/**
 * "Continue reading" memory.
 *
 * A single slot in `localStorage`: the reader resumes one thing, not a queue.
 * It stores only what the row needs to render a link — never any decrypted text,
 * so nothing private is left behind on a shared machine.
 *
 * Every read is validated rather than cast: `localStorage` is user-editable, so a
 * malformed value must degrade to "no entry" instead of throwing during render.
 */

const STORAGE_KEY = "vuong:continue-reading"

export interface ContinueEntry {
  /** Pathname as visited, including the locale segment. */
  href: string
  title: string
  kind: "chapter" | "note"
  lang: Lang
  /** Epoch milliseconds, used only for "last visited" ordering and freshness. */
  at: number
}

function isEntry(value: unknown): value is ContinueEntry {
  if (typeof value !== "object" || value === null) return false
  const entry = value as Record<string, unknown>

  return (
    typeof entry.href === "string" &&
    entry.href.startsWith("/") &&
    typeof entry.title === "string" &&
    (entry.kind === "chapter" || entry.kind === "note") &&
    (entry.lang === "en" || entry.lang === "vi") &&
    typeof entry.at === "number"
  )
}

/** The stored entry, or null in SSR, in private mode, or when the data is junk. */
export function readContinueEntry(): ContinueEntry | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    return isEntry(parsed) ? parsed : null
  } catch {
    // Storage can throw when disabled (Safari private mode) or when the value is
    // not JSON at all. Either way there is simply nothing to resume.
    return null
  }
}

export function saveContinueEntry(entry: ContinueEntry): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Quota or disabled storage: the feature is a convenience, so failing
    // silently is better than breaking the page the reader is on.
  }
}

export function clearContinueEntry(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // As above.
  }
}
