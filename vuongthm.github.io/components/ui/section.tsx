import type { ReactNode } from "react"
import { Container, type ContainerSize } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

/**
 * A page section: vertical rhythm, optional tinted background, and a heading
 * block with one layout.
 *
 * Sections previously each invented their own padding (`py-10 sm:py-14`,
 * `pt-16 pb-12 sm:pt-24 sm:pb-16`, …) and their own heading row. Routing all of
 * them through here means the page rhythm is tuned in one place.
 */

interface SectionProps {
  children: ReactNode
  className?: string
  size?: ContainerSize
  /** Tinted background, for alternating bands down the page. */
  tint?: boolean
  /** `none` when the parent already controls spacing. */
  spacing?: "default" | "tight" | "none"
  id?: string
}

const SPACING = {
  default: "py-[var(--space-section)]",
  tight: "py-8 sm:py-10",
  none: "",
} as const

export function Section({
  children,
  className,
  size = "default",
  tint = false,
  spacing = "default",
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(SPACING[spacing], tint && "bg-surface-sunken", className)}
    >
      <Container size={size}>{children}</Container>
    </section>
  )
}

interface SectionHeadingProps {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  /** Trailing element, usually a "view all" link. Sits beside the title on wide screens. */
  action?: ReactNode
  align?: "start" | "center"
  className?: string
  /** Heading level, for documents that already use an h1. */
  as?: "h2" | "h3"
}

export function SectionHeading({
  title,
  eyebrow,
  description,
  action,
  align = "start",
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex gap-4",
        align === "center"
          ? "flex-col items-center text-center"
          : "flex-col sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn(align === "start" && "max-w-2xl")}>
        {eyebrow ? (
          <Eyebrow tone="brand" className="mb-2.5">
            {eyebrow}
          </Eyebrow>
        ) : null}

        <Heading className="text-h2 text-foreground">{title}</Heading>

        {description ? (
          <p className="mt-2.5 text-small leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/**
 * The thin rule used to separate major blocks. A double line (thick over thin)
 * is the small recurring ornament that gives the pages their printed feel.
 */
export function SectionRule({ className }: { className?: string }) {
  return (
    <Container size="default" className={className}>
      <div aria-hidden="true" className="border-t border-border">
        <div className="mt-[3px] border-t border-border/60" />
      </div>
    </Container>
  )
}
