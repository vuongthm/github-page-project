"use client"

import { useSyncExternalStore } from "react"

/**
 * Shared, rAF-throttled scroll store.
 *
 * Before this existed the app attached five independent scroll listeners
 * (two inside the header alone), each calling setState on every scroll event.
 * That produced five React renders per event and was the main source of
 * jank while scrolling.
 *
 * Now there is exactly one listener for the whole document, it runs at most
 * once per animation frame, and every consumer subscribes through
 * `useSyncExternalStore` which avoids tearing during concurrent renders.
 */

export interface ScrollMetrics {
  /** window.scrollY in px. */
  y: number
  /** 0-100 percentage through the document. */
  progress: number
  /** True once the page is scrolled past `SCROLLED_THRESHOLD`. */
  scrolled: boolean
}

export const SCROLLED_THRESHOLD = 8

const SERVER_SNAPSHOT: ScrollMetrics = { y: 0, progress: 0, scrolled: false }

let snapshot: ScrollMetrics = SERVER_SNAPSHOT
const subscribers = new Set<() => void>()
let frame = 0

function measure() {
  frame = 0
  if (typeof window === "undefined") return

  const y = window.scrollY
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  const next: ScrollMetrics = {
    y,
    progress: scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (y / scrollable) * 100)),
    scrolled: y > SCROLLED_THRESHOLD,
  }

  // Bail out when nothing meaningful changed so subscribers do not re-render.
  if (
    next.scrolled === snapshot.scrolled &&
    Math.abs(next.y - snapshot.y) < 1 &&
    Math.abs(next.progress - snapshot.progress) < 0.1
  ) {
    return
  }

  snapshot = next
  for (const notify of subscribers) notify()
}

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

function subscribe(callback: () => void): () => void {
  if (subscribers.size === 0 && typeof window !== "undefined") {
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    measure()
  }

  subscribers.add(callback)

  return () => {
    subscribers.delete(callback)
    if (subscribers.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
  }
}

function getSnapshot(): ScrollMetrics {
  return snapshot
}

function getServerSnapshot(): ScrollMetrics {
  return SERVER_SNAPSHOT
}

/** Imperative subscription for consumers that write to the DOM directly. */
export function subscribeToScroll(callback: () => void): () => void {
  return subscribe(callback)
}

/** Current metrics without subscribing (useful inside effects). */
export function getScrollSnapshot(): ScrollMetrics {
  return snapshot
}

/** Full metrics object. Prefer the narrower hooks below for fewer re-renders. */
export function useScrollMetrics(): ScrollMetrics {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** True once the user scrolled past a few pixels. */
export function useScrolled(threshold = SCROLLED_THRESHOLD): boolean {
  const { y } = useScrollMetrics()
  return y > threshold
}

/** 0-100 reading progress of the whole document. */
export function useScrollProgress(): number {
  return useScrollMetrics().progress
}

/**
 * Imperative helper for the rare case where a component needs to scroll
 * without subscribing to the store (e.g. "back to top").
 */
export function scrollToTop(behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return
  window.scrollTo({ top: 0, behavior })
}

/** Scrolls an element into view, accounting for the sticky header height. */
export function scrollToId(id: string, offset = 88, behavior: ScrollBehavior = "smooth") {
  if (typeof document === "undefined") return
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior })
}
