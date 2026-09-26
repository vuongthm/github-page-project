import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Small uppercase label that sits above a heading.
 *
 * Previously written out by hand wherever it appeared (footer column titles,
 * blog ad badges, section labels), each with slightly different tracking and
 * size. One component means one voice.
 */
interface EyebrowProps {
  children: ReactNode
  className?: string
  as?: ElementType
  /** `brand` tints it with the accent colour, for section leads. */
  tone?: "muted" | "brand"
}

export function Eyebrow({ children, className, as: Component = "p", tone = "muted" }: EyebrowProps) {
  const Comp = Component as any
  return (
    <Comp
      className={cn(
        "font-mono text-eyebrow uppercase tracking-[0.18em] leading-none",
        tone === "brand" ? "text-accent-brand" : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </Comp>
  )
}
