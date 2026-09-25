/**
 * Motion design tokens.
 *
 * Centralised so every animation in the site shares the same rhythm — and so
 * tuning "how the site feels" is a one-file change rather than a hunt through
 * a dozen components.
 *
 * Performance rules this module encodes:
 *   - Only `transform` and `opacity` are ever animated. Both are composited on
 *     the GPU, so no layout or paint work happens per frame.
 *   - Distances stay small. Movement should be felt, not watched.
 *   - Everything is opt-out: `prefers-reduced-motion: reduce` disables it all
 *     (see the rule in `app/globals.css`).
 */

export const EASE = {
  /** Decelerating curve for content entering the viewport. */
  enter: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Symmetric curve for state changes. */
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const

export const DURATION = {
  instant: 120,
  fast: 200,
  base: 380,
  slow: 640,
} as const

/** CSS custom properties consumed by the reveal rules in globals.css. */
export const revealVars = (options: { distance?: number; duration?: number; delay?: number } = {}) =>
  ({
    "--reveal-distance": `${options.distance ?? 18}px`,
    "--reveal-duration": `${options.duration ?? DURATION.slow}ms`,
    "--reveal-delay": `${options.delay ?? 0}ms`,
    "--reveal-ease": EASE.enter,
  }) as React.CSSProperties

/**
 * True when the visitor asked their operating system to reduce motion.
 *
 * Checked imperatively (rather than through a media-query hook) because every
 * caller uses it inside an effect, and re-rendering on a preference change
 * would be pointless work.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * True on touch-first devices.
 *
 * Parallax is skipped there: the effect costs battery, and on a phone the
 * address bar already resizes the viewport on every scroll, which fights with
 * a scroll-linked transform.
 */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(pointer: coarse)").matches
}

/**
 * Resolves after the browser has painted the next two frames.
 *
 * NOTE — why there is no View Transition helper here anymore:
 *
 * `components/motion/view-transition-link.tsx` used to wrap navigation in
 * `document.startViewTransition()` and wait for the new route with a
 * `requestAnimationFrame` loop. That failed in practice:
 *
 *   - The browser throttles `requestAnimationFrame` *while a view transition is
 *     running*, so a 400 ms budget stretched to several seconds of frozen UI.
 *   - Each navigation was delayed by that wait, making every tab change feel
 *     sluggish.
 *   - Eventually the browser gave up with
 *     `TimeoutError: Transition was aborted because of timeout in DOM update`,
 *     surfacing as an unhandled promise rejection.
 *
 * Cross-page motion is now pure CSS (the `.page-enter` animation applied by
 * `components/layout/page-transition.tsx`): the same perceived polish, no
 * waiting, no JavaScript in the navigation path. Do not reintroduce a
 * navigation-blocking wait without measuring it on a low-power CPU first.
 */
