import type { ElementType, ReactNode } from "react"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"

/**
 * Bento tile: one hub of the site, with its live count and its latest item.
 *
 * `count` and `latest` come from the generated content data at build time, so
 * the home page advertises what is actually published instead of hardcoded copy.
 *
 * Hierarchy is carried by size and type weight rather than by colour: the icon
 * is the only saturated element, which is what keeps the 10 % accent budget.
 */
interface HubCardProps {
  href: string
  title: string
  description: string
  icon: ElementType
  /** Live item count, e.g. 3 series. Hidden when undefined. */
  count?: number
  countLabel?: string
  /** Most recent item title, shown as the tile's footnote. */
  latest?: string
  /** Grid span, e.g. "sm:col-span-2 lg:col-span-6". */
  className?: string
  /** Draws attention to the primary hub. */
  emphasis?: boolean
  children?: ReactNode
}

export function HubCard({
  href,
  title,
  description,
  icon: Icon,
  count,
  countLabel,
  latest,
  className,
  emphasis = false,
  children,
}: HubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-xl)]",
        "border border-border bg-surface p-5 sm:p-6",
        // transform/opacity only: the lift stays on the compositor.
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--elevation-2)]",
        emphasis && "bg-surface-sunken",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[var(--radius)]",
            "bg-accent-brand/10 text-accent-brand",
            "transition-colors duration-200 group-hover:bg-accent-brand group-hover:text-accent-brand-foreground",
          )}
        >
          <Icon size={16} />
        </span>

        {typeof count === "number" ? (
          <span className="font-mono text-eyebrow uppercase tracking-[0.14em] text-muted-foreground">
            {count}
            {countLabel ? <span className="ml-1 opacity-70">{countLabel}</span> : null}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-h3 text-card-foreground transition-colors duration-150 group-hover:text-accent-brand">
          {title}
        </h3>
        <p className="text-small leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {children}

      {/* Latest item, pinned to the bottom so tiles of different copy lengths
          still line up on the same baseline (Gestalt: proximity). */}
      {latest ? (
        <p className="mt-auto line-clamp-1 border-t border-border pt-3 text-caption text-muted-foreground">
          <span className="font-mono text-eyebrow uppercase tracking-[0.14em] opacity-70">
            Latest
          </span>{" "}
          <span className="text-foreground/80">{latest}</span>
        </p>
      ) : null}
    </Link>
  )
}
