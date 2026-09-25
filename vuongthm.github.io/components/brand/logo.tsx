import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Brand assets.
 *
 * One definition, used by the header, the footer and the not-found page, so the
 * mark cannot drift between them.
 *
 * The mark is a "V" rising over a horizon line — the coastal landscape the blog
 * is written from — with the right stroke in the brand ochre. It reads at 16 px
 * and at 40 px, which a detailed illustration would not.
 */

interface LogoProps {
  className?: string
  /** Rendered size in px. The SVG scales cleanly. */
  size?: number
  /** Include the horizon line. Off for very small sizes where it muddies. */
  horizon?: boolean
}

export function Logo({ className, size = 24, horizon = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M5 5.5 12 18.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M19 5.5 12 18.5" stroke="var(--accent-brand)" strokeWidth="2.2" />
      {horizon && (
        <path d="M3 21.5h18" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
      )}
    </svg>
  )
}

interface WordmarkProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const WORDMARK_SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
} as const

export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-serif font-semibold leading-none tracking-[-0.02em] text-foreground",
        WORDMARK_SIZES[size],
        className,
      )}
    >
      {siteConfig.shortName}
      <span className="text-accent-brand">.</span>
    </span>
  )
}

interface BrandLockupProps {
  className?: string
  size?: "sm" | "md" | "lg"
  /** Shows the author handle in mono underneath, for the footer. */
  withHandle?: boolean
}

export function BrandLockup({ className, size = "md", withHandle = false }: BrandLockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo size={size === "sm" ? 18 : size === "lg" ? 28 : 22} />
      <span className="flex flex-col">
        <Wordmark size={size} />
        {withHandle && (
          <span className="mt-1 font-mono text-eyebrow uppercase tracking-[0.18em] text-muted-foreground">
            @{siteConfig.shortName}
          </span>
        )}
      </span>
    </span>
  )
}
