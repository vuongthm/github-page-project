"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Search, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Link } from "@/components/ui/link"
import { BrandLockup } from "@/components/brand/logo"
import { cn } from "@/lib/utils"
import { useLang } from "@/components/providers/lang-provider"

const NAV_LINKS = [
  { key: "home", href: "/"},
  { key: "stories", href: "/stories" },
  { key: "notes", href: "/notes" },
  { key: "tags", href: "/tags" },
  { key: "about", href: "/about" },
] as const

const NAV_LABELS: Record<string, { en: string; vi: string }> = {
  home: { en: "Home", vi: "Trang chủ" },
  stories: { en: "Stories", vi: "Chuyện kể "},
  notes: { en: "Notes", vi: "Ghi chú"},
  tags: { en: "Tags", vi: "Thẻ"},
  about: { en: "About", vi: "Về tôi"},
}

const ICONS = {
  home: "🏠", stories: "📚", notes: "📝", tags: "🏷️", about: "👤"
}

export function ModernHeader() {
  const { setTheme, resolvedTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const pathname = usePathname()
  const isNavActive = (href: string) => {
    if (href === "/") return pathname === `/${lang}` || pathname === "/"
    return pathname.startsWith(href.replace("/", `/${lang}/`))
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 inset-x-0 z-50 bg-surface/70 dark:bg-surface/60 backdrop-blur-xl border-b border-border/50"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--space-gutter)] h-16 flex items-center justify-between">
        <Link href="/"><BrandLockup size="sm" /></Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                "hover:bg-accent-brand/10 hover:text-accent-brand",
                isNavActive(href)
                  ? "bg-accent-brand/15 text-accent-brand"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-xs">{ICONS[key as keyof typeof ICONS]}</span>
              {NAV_LABELS[key][lang]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand transition-all"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
          </button>

          <button
            onClick={() => setLang(lang === "en" ? "vi" : "en")}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-lg px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand transition-all"
            aria-label="Toggle language"
          >
            {lang === "en" ? "Tiếng Việt" : "English"}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand transition-all md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border bg-surface/90 backdrop-blur-xl"
        >
          <div className="px-[var(--space-gutter)] py-4 flex flex-col gap-2">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isNavActive(href)
                    ? "bg-accent-brand/15 text-accent-brand"
                    : "text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand"
                )}
              >
                <span>{ICONS[key as keyof typeof ICONS]}</span>
                {NAV_LABELS[key][lang]}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
        </motion.header>
  )
}