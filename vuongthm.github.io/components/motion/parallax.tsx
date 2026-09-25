"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { isCoarsePointer, prefersReducedMotion } from "@/lib/motion"
import { subscribeToScroll } from "@/lib/scroll-store"
import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Scroll-linked vertical parallax for hero imagery.
 *
 * How it stays cheap:
 *   - The transform is written straight to the DOM inside a subscription to the
 *     shared scroll store. A scroll-linked effect must never re-render React
 *     sixty times a second.
 *   - Only `translate3d` is touched, so the work stays on the compositor.
 *   - Disabled for `prefers-reduced-motion` and on coarse pointers (battery, and
 *     mobile browsers resize the viewport on scroll which fights the effect).
 *
 * The inner layer is deliberately oversized by `bleed` on both sides, so the
 * travel never exposes an edge of the image.
 *
 *   <div className="relative h-[320px] overflow-hidden">
 *     <Parallax className="absolute inset-0">
 *       <Image src="/hometown/dai-lanh-coast.webp" alt="" fill className="object-cover" />
 *     </Parallax>
 *   </div>
 */
interface ParallaxProps {
  children: ReactNode
  className?: string
  /** Peak travel in px over a full scroll pass. 0 disables the effect. */
  distance?: number
  /** Extra head-room as a fraction of the height, on top and bottom. */
  bleed?: number
}

export function Parallax({ children, className, distance = 48, bleed = 0.12 }: ParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const layer = layerRef.current
    if (!container || !layer) return
    if (distance === 0 || prefersReducedMotion() || isCoarsePointer()) return
    if (!siteConfig.features.motion) return

    let documentTop = 0
    let height = 0
    let viewportHeight = 0

    const measure = () => {
      const rect = container.getBoundingClientRect()
      documentTop = rect.top + window.scrollY
      height = rect.height || 1
      viewportHeight = window.innerHeight
    }

    const update = () => {
      const elementCenter = documentTop + height / 2
      const viewportCenter = window.scrollY + viewportHeight / 2

      // Roughly -1 when the element is below the fold, +1 when it is above.
      const progress = Math.max(
        -1.4,
        Math.min(1.4, (viewportCenter - elementCenter) / (viewportHeight + height)),
      )

      layer.style.transform = `translate3d(0, ${(progress * distance).toFixed(2)}px, 0)`
    }

    measure()
    update()

    const unsubscribe = subscribeToScroll(update)
    const onResize = () => {
      measure()
      update()
    }

    window.addEventListener("resize", onResize, { passive: true })

    return () => {
      unsubscribe()
      window.removeEventListener("resize", onResize)
      layer.style.transform = ""
    }
  }, [distance])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <div
        ref={layerRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `${-bleed * 100}%`, height: `${(1 + bleed * 2) * 100}%` }}
      >
        {children}
      </div>
    </div>
  )
}
