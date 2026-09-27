"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Search, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Link } from "@/components/ui/link"
import { BrandLockup } from "@/components/brand/logo"
import { LangSwitcher } from "@/components/features/lang-switcher"
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

export function ModernHeader() {
    const { setTheme, resolvedTheme } = useTheme()
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const pathname = usePathname()
  const isNavActive = (href: string) => {
    // Remove lang prefix from pathname for comparison
    const pathWithoutLang = pathname.replace(`/${lang}`, "")
    if (href === "/") {
      return pathWithoutLang === "" || pathWithoutLang === "/"
    }
    return pathWithoutLang.startsWith(href)
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
                "relative flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all",
                "hover:bg-accent-brand/10 hover:text-accent-brand",
                isNavActive(href) ? "text-accent-brand" : "text-muted-foreground"
              )}
            >
              {NAV_LABELS[key][lang]}
              {isNavActive(href) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent-brand rounded-full" />
              )}
            </Link>
          ))}
        </nav>

                          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
              window.dispatchEvent(event)
            }}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand transition-all"
            aria-label="Open search (Ctrl+K)"
            title="Search (Ctrl+K)"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand transition-all"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
          </button>

          <LangSwitcher />

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
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="md:hidden absolute top-full right-4 mt-2 w-52 rounded-lg border border-border bg-surface shadow-[var(--elevation-3)]"
        >
          <div className="py-1.5 flex flex-col gap-1">
            {NAV_LINKS.map(({ key, href }) => {
              const active = isNavActive(href)
              return (
                              <Link
                  key={key}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg mx-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all",
                    active
                      ? "bg-accent-brand/10 text-accent-brand"
                      : "text-muted-foreground hover:bg-accent-brand/10 hover:text-accent-brand"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    active ? "bg-accent-brand" : "bg-transparent"
                  )} />
                  {NAV_LABELS[key][lang]}
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}
        </motion.header>
  )
}