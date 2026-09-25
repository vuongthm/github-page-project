"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

/**
 * Replays the CSS page-entrance animation on every client-side navigation.
 *
 * React keeps the same DOM node when two routes render the same element type at
 * the same position, so a CSS animation on `<main>` would only run on a hard
 * page load. Keying the wrapper on the pathname forces React to mount a fresh
 * element for each route, which restarts the animation.
 *
 * This is intentionally the whole mechanism: no `startViewTransition`, no
 * waiting for the next route, nothing in the navigation path that could delay
 * it. See the note in `lib/motion.ts` for the version that did not work.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
