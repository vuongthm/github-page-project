import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Brand assets.
 *
 * One definition, used by the header, the footer and the not-found page, so the
 * mark cannot drift between them.
 *
 * The mark is a stepped waveform — like a guitar tuner or equalizer — rising
 * in a V-shape pattern, with all strokes in the brand blue accent.
 */

interface LogoProps {
  className?: string
  /** Rendered size in px. The SVG scales cleanly. */
  size?: number
  /** Include the baseline. Off for very small sizes where it muddies. */
  baseline?: boolean
}

export function Logo({ className, size = 24, baseline = true }: LogoProps) {
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
      <line x1="1"     y1="9"    x2="1"     y2="15"   stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="4.14"  y1="4"    x2="4.14"  y2="20"   stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="7.29"  y1="3.5"  x2="7.29"  y2="20.5" stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="10.43" y1="6.5"  x2="10.43" y2="17.5" stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="13.57" y1="7"    x2="13.57" y2="17"   stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="16.71" y1="9.5"  x2="16.71" y2="14.5" stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="19.86" y1="7"    x2="19.86" y2="17"   stroke="var(--accent-brand)" strokeWidth="2.2"></line>
      <line x1="23"    y1="6"    x2="23"    y2="18"   stroke="var(--accent-brand)" strokeWidth="2.2"></line>
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
