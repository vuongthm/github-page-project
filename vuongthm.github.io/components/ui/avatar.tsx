"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Avatar with a graceful fallback.
 *
 * Fixes a real bug: `about/people` referenced `people-*.png` files that do not
 * exist in `public/`, so the page served three broken images. Here the image
 * simply never renders if it fails to load, and an initials tile takes its
 * place — which is also the correct look for a portrait that is missing.
 *
 * Rendered as a plain <div>, never <a>, so it is safe inside a link.
 */

const SIZES = {
  sm: { box: "size-8", text: "text-[0.625rem]" },
  md: { box: "size-12", text: "text-[0.75rem]" },
  lg: { box: "size-16", text: "text-small" },
  xl: { box: "size-24 sm:size-28 md:size-36", text: "text-h3" },
} as const

export type AvatarSize = keyof typeof SIZES

interface AvatarProps {
  src?: string
  name: string
  size?: AvatarSize
  className?: string
  /** Set on the single above-the-fold avatar so it is not lazy-loaded. */
  priority?: boolean
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ src, name, size = "md", className, priority = false }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const s = SIZES[size]

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        "rounded-full border border-border bg-surface-sunken text-muted-foreground",
        s.box,
        className,
      )}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          priority={priority}
          sizes="144px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true" className={cn("font-mono font-medium tracking-tight", s.text)}>
          {initialsOf(name)}
        </span>
      )}
      {!src || failed ? <span className="sr-only">{name}</span> : null}
    </span>
  )
}
