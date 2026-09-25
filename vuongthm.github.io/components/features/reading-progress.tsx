"use client"

import { useScrollProgress } from "@/lib/scroll-store"

/**
 * Thin progress bar pinned to the top of the viewport.
 *
 * Two improvements over the previous implementation:
 *   - the scroll maths live in `lib/scroll-store.ts`, so this component owns no
 *     listener and no rAF loop of its own;
 *   - the bar animates `transform: scaleX()` instead of `width`, which keeps the
 *     work on the compositor instead of forcing a layout pass every frame.
 */
export function ReadingProgress() {
  const progress = useScrollProgress()

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-transparent pointer-events-none"
      style={{ opacity: progress >= 99.5 ? 0 : 1, transition: "opacity 0.3s" }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full w-full origin-left bg-accent-brand will-change-transform"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  )
}