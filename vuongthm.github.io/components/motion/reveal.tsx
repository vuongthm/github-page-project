"use client"

import type { ElementType, ReactNode } from "react"
import { DURATION, revealVars } from "@/lib/motion"
import { useRevealOnScroll } from "@/lib/use-reveal"
import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Wraps content so it fades and rises into place the first time it scrolls
 * into view.
 *
 * Only `opacity` and `transform` are animated, and the element is styled through
 * CSS custom properties, so a variation (distance, duration, delay) is a prop
 * change rather than a new component.
 *
 *   <Reveal>…</Reveal>
 *   <Reveal delay={120} distance={28}>…</Reveal>
 *   <Reveal as="li" className="…">…</Reveal>
 */
interface RevealProps {
  children: ReactNode
  /** Element to render. Defaults to a `div`. */
  as?: ElementType
  className?: string
  /** Rise distance in px. Keep it small — movement should be felt, not watched. */
  distance?: number
  duration?: number
  /** Stagger offset in ms, for revealing a list. */
  delay?: number
}

export function Reveal({
  children,
  as: Component = "div",
  className,
  distance = 18,
  duration = DURATION.slow,
  delay = 0,
}: RevealProps) {
  const { ref, phase } = useRevealOnScroll<HTMLElement>({
    disabled: !siteConfig.features.motion,
  })

  return (
    <Component
      ref={ref}
      data-reveal={phase}
      style={phase === "static" ? undefined : revealVars({ distance, duration, delay })}
      className={cn(className)}
    >
      {children}
    </Component>
  )
}
