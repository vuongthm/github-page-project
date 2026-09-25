import type { Lang } from "@/lib/data"

/**
 * Neutral placeholder shown while a stored unlock session is being checked.
 *
 * Rendering the lock form during that window made an already-unlocked page
 * flash the padlock before the content appeared. Matching the lock screen's
 * dimensions keeps the layout from jumping when the content takes over.
 */
export function VaultPlaceholder({ lang }: { lang: Lang }) {
  const label = lang === "vi" ? "Đang kiểm tra quyền truy cập…" : "Checking access…"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto py-12 px-4"
    >
      <div className="size-16 rounded-[var(--radius-lg)] bg-muted border border-border flex items-center justify-center mb-6">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-pulse" />
          <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:150ms]" />
          <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:300ms]" />
        </span>
      </div>
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  )
}
