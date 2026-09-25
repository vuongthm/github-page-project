"use client"

import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "@/lib/motion"

/**
 * Scroll-triggered reveal, backed by **one** shared IntersectionObserver.
 *
 * Design notes:
 *   - One observer for the whole document. Creating one per element (the usual
 *     snippet) means dozens of observers on a content page.
 *   - An element that is already on screen at mount is shown immediately, never
 *     armed. Arming it would make visible content blink out and animate back.
 *   - Without IntersectionObserver, or with `prefers-reduced-motion`, the
 *     element is simply shown. Content is never hidden behind an animation.
 */

export type RevealPhase =
  /** Visible, no animation (initial render, reduced motion, already on screen). */
  | "static"
  /** Hidden and waiting to enter the viewport. */
  | "armed"
  /** Entered; the CSS transition runs from armed to this state. */
  | "shown"

let sharedObserver: IntersectionObserver | null = null
const pendingReveals = new Map<Element, () => void>()

function getSharedObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const notify = pendingReveals.get(entry.target)
        if (notify) notify()

        // One-shot: stop watching as soon as it has been revealed.
        pendingReveals.delete(entry.target)
        sharedObserver?.unobserve(entry.target)
      }
    },
    // Fire slightly before the element reaches the bottom edge so the animation
    // has settled by the time it is comfortably in view.
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  )

  return sharedObserver
}

export interface UseRevealOptions {
  /** Skip the effect entirely (e.g. feature flag off). */
  disabled?: boolean
}

export function useRevealOnScroll<T extends HTMLElement>(options: UseRevealOptions = {}) {
  const ref = useRef<T | null>(null)
  const [phase, setPhase] = useState<RevealPhase>("static")
  const { disabled = false } = options

  useEffect(() => {
    if (disabled) return

    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      setPhase("shown")
      return
    }

    // Already visible: show without animating.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setPhase("shown")
      return
    }

    setPhase("armed")

    const observer = getSharedObserver()
    pendingReveals.set(element, () => setPhase("shown"))
    observer.observe(element)

    return () => {
      pendingReveals.delete(element)
      observer.unobserve(element)
    }
  }, [disabled])

  return { ref, phase }
}
