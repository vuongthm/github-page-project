"use client"

import { useEffect, useState } from "react"

/**
 * Scroll-spy over a list of element ids.
 *
 * A thin band near the top of the viewport decides the active heading, so
 * exactly one item is highlighted while scrolling rather than a flickering set.
 * The observer here is intentionally per-hook rather than shared: it must stay
 * subscribed for the life of the page, unlike the one-shot reveal observer in
 * `lib/use-reveal.ts`.
 *
 * @param ids heading element ids, in document order.
 * @returns the id of the active heading, or null.
 */
export function useScrollSpy(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  // A stable dependency key: callers usually build the array inline, so the
  // array identity changes on every render.
  const key = ids.join("|")

  useEffect(() => {
    if (ids.length === 0) return

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }

        // The first heading (document order) inside the band wins; if the band
        // is empty, keep the last known value instead of flashing null.
        const next = ids.find((id) => visible.has(id))
        if (next) setActiveId(next)
      },
      {
        // Band from just under the sticky header down to 35 % of the viewport.
        rootMargin: "-72px 0px -35% 0px",
        threshold: 0,
      },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
    // `key` covers the array contents; `ids` itself is a fresh array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return activeId
}
