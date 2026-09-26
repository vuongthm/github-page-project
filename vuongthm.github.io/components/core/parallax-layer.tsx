"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, type ReactNode } from "react"

interface ParallaxLayerProps {
  children: ReactNode
  speed?: number
  className?: string
}

/**
 * ParallaxLayer — wraps children and applies a subtle parallax offset
 * based on scroll position. Speed <1 = slower than scroll (background),
 * speed >1 = faster (foreground).
 */
export function ParallaxLayer({
  children,
  speed = 0.5,
  className,
}: ParallaxLayerProps) {
    const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: ref })
  const yRange = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/**
 * ParallaxContainer — a scroll-aware wrapper that offsets children.
 * Useful for hero sections and dividers.
 */
export function ParallaxContainer({
  children,
  offset = 50,
  className,
}: {
  children: ReactNode
  offset?: number
  className?: string
}) {
  return (
    <div className={className} style={{ transform: `translateZ(-${offset}px) scale(${1 + offset * 0.002})` }}>
      {children}
    </div>
  )
}