"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"

interface ExpandableCardProps {
  href?: string
  title: string
  description?: string
  image?: string
  tags?: string[]
  children?: React.ReactNode
  className?: string
  defaultHeight?: string
  expandedHeight?: string
}

/**
 * HoverExpandCard — a card that expands on hover to reveal additional content.
 * Uses Framer Motion for smooth animation.
 */
export function HoverExpandCard({
  href,
  title,
  description,
  image,
  tags = [],
  children,
  className,
  defaultHeight = "h-64",
  expandedHeight = "h-[420px]",
}: ExpandableCardProps) {
  const [isHovered, setIsHovered] = useState(false)

    const CardInner = () => (
    <motion.div
      className={cn(
        "group relative flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-6 overflow-hidden",
        "transition-all duration-500 ease-[0.25,0.1,0.25,1]",
        defaultHeight,
        isHovered ? expandedHeight : defaultHeight,
        "cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated border accent */}
      <motion.div
        className="absolute inset-0 rounded-[var(--radius-xl)] opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 rounded-[var(--radius-xl)] border-2 border-accent-brand/40" />
      </motion.div>

      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent-brand/5 via-transparent to-accent-brand/10 rounded-[var(--radius-xl)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.7 : 0 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative z-10 flex-1 overflow-hidden">
        <motion.h3
          className="font-display text-2xl font-semibold text-card-foreground"
          animate={{
            color: isHovered ? "var(--accent-brand)" : "var(--card-foreground)",
          }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>

        <motion.p
          className="mt-2 text-sm text-muted-foreground leading-relaxed"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: isHovered ? 0.9 : 1, y: isHovered ? 0 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {description}
        </motion.p>

        {/* Expanded content */}
        {children && (
          <motion.div
            className="relative mt-4 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Tags at bottom */}
      {tags.length > 0 && (
        <motion.div
          className="relative z-10 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-accent-brand/10 px-3 py-1 text-xs font-medium text-accent-brand"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* Chevron indicator */}
      <motion.div
        className="absolute bottom-4 right-4 z-10 text-muted-foreground"
        animate={{
          rotate: isHovered ? 180 : 0,
          opacity: isHovered ? 1 : 0.5,
          y: isHovered ? 0 : 2,
        }}
        transition={{ duration: 0.3 }}
      >
        <ChevronDown size={16} />
      </motion.div>
              </motion.div>
  )

  if (href) {
    return <Link href={href} className="block"><CardInner /></Link>
  }

  return <CardInner />
}

/**
 * MicroCard — a minimal card with subtle hover feedback
 */
export function MicroCard({
  title,
  description,
  icon,
  href,
  className,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  href?: string
  className?: string
}) {
  return (
    <motion.div
      className={cn(
        "group relative rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-all duration-300",
        "hover:border-accent-brand/30 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <motion.div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-brand/10 text-accent-brand"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}
        <div className="flex-1">
          <motion.h3
            className="text-lg font-semibold text-foreground"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}


