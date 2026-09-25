"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { saveContinueEntry } from "@/lib/continue-reading"
import { siteConfig } from "@/lib/site.config"
import type { Lang } from "@/lib/data"

/**
 * Remembers the last long-form page the reader opened.
 *
 * Mounted once in the locale layout instead of on every detail page:
 *   /en/stories/<series>/<chapter>/  -> chapter
 *   /en/notes/<slug>/                -> note
 *
 * The title comes from the page's own `<h1>` rather than from the data layer, so
 * this stays correct for chapters, notes and any future long-form route without
 * reaching into generated types or being wired up per page.
 *
 * It records on arrival, not on scroll. "Where I stopped" is already cheap to see
 * from the page itself, and a scroll threshold would add a listener to every
 * reading page for a marginal gain.
 *
 * Nothing private is stored: only the path and the on-screen heading.
 */

/** Long-form page classification, mirroring FloatDock's reading routes. */
function classify(pathname: string | null): "chapter" | "note" | null {
  if (!pathname) return null
  const parts = pathname.split("/").filter(Boolean)
  // parts[0] is the locale.
  if (parts[1] === "stories" && parts.length === 4) return "chapter"
  if (parts[1] === "notes" && parts.length === 3) return "note"
  return null
}

export function ContinueReadingTracker({ lang }: { lang: Lang }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!siteConfig.features.continueReading) return

    const kind = classify(pathname)
    if (!kind) return

    // The heading is rendered by the page itself, so it is in the DOM by the
    // time an effect runs. `document.title` is the fallback for a heading that
    // was not given as an `<h1>`.
    const heading = document.querySelector("h1")?.textContent?.trim() || document.title

    saveContinueEntry({
      href: pathname,
      title: heading.replace(/\s+/g, " "),
      kind,
      lang,
      at: Date.now(),
    })
  }, [pathname, lang])

  return null
}
