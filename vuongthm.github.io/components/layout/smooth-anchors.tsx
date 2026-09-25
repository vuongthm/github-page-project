"use client"

import { useEffect } from "react"
import { prefersReducedMotion } from "@/lib/motion"

/**
 * Smooth scrolling for in-page anchors, and only for in-page anchors.
 *
 * `scroll-behavior: smooth` on `<html>` is tempting but wrong here: Next.js
 * resets the document scroll position on every route change, so a smooth
 * document also animates that reset. The result is that a new page appears to
 * slide up from wherever the previous page was scrolled instead of starting at
 * the top — see the note in `app/globals.css`.
 *
 * Handling the click instead keeps the nice behaviour for table-of-contents and
 * heading-anchor jumps while leaving route changes instantaneous.
 *
 * Anchors that point at another page (`/about#hometown`) fall through to normal
 * navigation because the target element is not in the current document.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return

      const id = decodeURIComponent(anchor.getAttribute("href")?.slice(1) ?? "")
      if (!id) return

      const element = document.getElementById(id)
      if (!element) return

      event.preventDefault()

      element.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      })

      // Keep the URL in sync (and the anchor shareable) without a page jump.
      history.replaceState(null, "", `#${id}`)
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
