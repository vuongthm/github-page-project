"use client"

import { useState, useRef, useEffect } from "react"
import { useLang } from "@/components/providers/lang-provider"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/data"

const LANGS: Record<Lang, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  vi: { flag: "🇻🇳", label: "Tiếng Việt" },
}

export function LangSwitcher() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const current = LANGS[lang]

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm hover:bg-accent-brand/10 hover:text-accent-brand transition-all"
      >
        {current.flag}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className="absolute top-full right-0 mt-1 w-40 origin-top-right rounded-lg border border-border bg-surface shadow-[var(--elevation-3)] focus:outline-none z-50"
        >
          <div className="py-1">
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <button
                key={l}
                role="menuitem"
                onClick={() => {
                  setLang(l)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm",
                  "hover:bg-accent-brand/10 hover:text-accent-brand",
                  l === lang
                    ? "text-accent-brand"
                    : "text-muted-foreground"
                )}
              >
                <span className="text-base">{LANGS[l].flag}</span>
                {LANGS[l].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}