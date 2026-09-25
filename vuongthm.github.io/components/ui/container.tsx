import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Page container.
 *
 * The horizontal gutters and the maximum width used to be repeated as the class
 * string `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` in about thirty places, which
 * made the page rhythm impossible to change. It now lives here, driven by the
 * `--container-max` (1200 px) and `--space-gutter` tokens.
 */

export type ContainerSize = "default" | "wide" | "narrow"

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: ContainerSize
  as?: ElementType
}

export function Container({ children, className, size = "default", as: Component = "div" }: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full",
        // Gutters come from the spacing token so every page shares one rhythm.
        "px-[var(--space-gutter)]",
        size === "default" && "max-w-[var(--container-max)]",
        size === "wide" && "max-w-[90rem]",
        size === "narrow" && "max-w-[var(--reading-measure)]",
        className,
      )}
    >
      {children}
    </Component>
  )
}
