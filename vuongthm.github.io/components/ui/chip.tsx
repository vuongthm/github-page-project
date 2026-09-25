import type { ReactNode } from "react"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"

/**
 * Tag / label pill.
 *
 * Note cards, series cards and the tag index each used to define their own
 * `rounded-full bg-muted text-[11px]` pill, and they had already drifted apart in
 * size and padding. One component, three tones.
 */

export type ChipTone = "neutral" | "brand" | "sea"

const TONES: Record<ChipTone, string> = {
  neutral: "border-border bg-muted/70 text-muted-foreground",
  brand: "border-accent-brand/20 bg-accent-brand/10 text-accent-brand",
  sea: "border-sea/25 bg-sea/10 text-sea",
}

const BASE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption leading-5 whitespace-nowrap"

interface ChipProps {
  children: ReactNode
  tone?: ChipTone
  className?: string
}

export function Chip({ children, tone = "neutral", className }: ChipProps) {
  return <span className={cn(BASE, TONES[tone], className)}>{children}</span>
}

interface ChipLinkProps extends ChipProps {
  href: string
}

/** Chip that links to a tag index. Gets the same hover affordance everywhere. */
export function ChipLink({ href, children, tone = "sea", className }: ChipLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        BASE,
        TONES[tone],
        "transition-colors duration-150 hover:border-current/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  )
}
