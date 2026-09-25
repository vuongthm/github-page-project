import { cn } from "@/lib/utils"

/**
 * Loading placeholder.
 *
 * Shape-driven rather than generic: a list of notes and a grid of album tiles
 * need different skeletons, and a skeleton that does not match the final layout
 * causes a visible jump when the real content arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[var(--radius)] bg-muted",
        // Slightly warm tint so it reads as "paper waiting" rather than as a
        // broken grey box.
        "motion-reduce:animate-none",
        className,
      )}
    />
  )
}

/** Skeleton for a stacked list (notes, chapters). */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** Skeleton for a card grid (series, albums). */
export function SkeletonGrid({ tiles = 3, className }: { tiles?: number; className?: string }) {
  return (
    <div
      className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: tiles }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-[16/9] w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state. Every list in the app renders one of these rather than a blank
 * region, so a missing filter result never looks like a broken page.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border",
        "px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-serif text-h3 text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-small text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
