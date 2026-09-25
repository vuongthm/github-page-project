"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Keyboard } from "lucide-react"
import { siteConfig } from "@/lib/site.config"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/data"

/**
 * "?" keyboard shortcut reference.
 *
 * Phase 2 and Phase 3 added keyboard behaviour (Ctrl/Cmd+K, Esc, arrow keys in
 * the palette) that stays invisible unless it is written down. This is that
 * somewhere.
 *
 * Everything listed must actually work. Button-only features — text size, focus
 * mode, back to top — are grouped separately and shown without a key symbol, so
 * the panel never promises a binding that does nothing.
 *
 * Behaviour mirrors the command palette: `z-50` above `FloatDock`, capture-phase
 * Esc that stops propagation, body scroll lock, focus restored on close.
 */

type Entry = { keys: string[]; label: string }

const LABELS: Record<
  Lang,
  {
    title: string
    hint: string
    groups: { global: string; palette: string; reading: string }
    global: Entry[]
    palette: Entry[]
    reading: string[]
  }
> = {
  en: {
    title: "Keyboard shortcuts",
    hint: "Press ? anywhere to open this panel.",
    groups: { global: "Anywhere", palette: "Command palette", reading: "Reading dock" },
    global: [
      { keys: ["⌘", "K"], label: "Open the command palette" },
      { keys: ["esc"], label: "Close an overlay, or leave focus mode" },
      { keys: ["?"], label: "Show this panel" },
    ],
    palette: [
      { keys: ["↑", "↓"], label: "Move through results" },
      { keys: ["↵"], label: "Open the highlighted result" },
      { keys: ["esc"], label: "Close the palette" },
    ],
    reading: ["Text size (larger / smaller)", "Focus mode", "Back to top"],
  },
  vi: {
    title: "Phím tắt",
    hint: "Bấm ? ở bất kỳ đâu để mở bảng này.",
    groups: { global: "Mọi nơi", palette: "Bảng lệnh", reading: "Thanh đọc" },
    global: [
      { keys: ["⌘", "K"], label: "Mở bảng lệnh" },
      { keys: ["esc"], label: "Đóng lớp phủ, hoặc thoát chế độ tập trung" },
      { keys: ["?"], label: "Mở bảng này" },
    ],
    palette: [
      { keys: ["↑", "↓"], label: "Di chuyển giữa các kết quả" },
      { keys: ["↵"], label: "Mở kết quả đang chọn" },
      { keys: ["esc"], label: "Đóng bảng lệnh" },
    ],
    reading: ["Cỡ chữ (lớn hơn / nhỏ hơn)", "Chế độ tập trung", "Lên đầu trang"],
  },
}

const KBD =
  "rounded-[var(--radius)] border border-border bg-muted px-1.5 py-0.5 " +
  "font-mono text-[10px] text-muted-foreground"

const GROUP_TITLE = "mb-2 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase"

/** True when the keystroke came from somewhere the reader is typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

/** One shortcut: description on the left, keys on the right. */
function ShortcutRow({ entry }: { entry: Entry }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-small text-foreground/90">{entry.label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {entry.keys.map((key) => (
          <kbd key={key} className={KBD}>
            {key}
          </kbd>
        ))}
      </span>
    </li>
  )
}


export function ShortcutHelp({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const L = LABELS[lang]
  const close = useCallback(() => setOpen(false), [])

  // "?" opens, unless the reader is typing — otherwise a question mark could
  // never be entered in the header field or in the palette.
  useEffect(() => {
    if (!siteConfig.features.shortcutHelp) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?") return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      setOpen((value) => !value)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Capture phase, so Esc closes this panel before FloatDock's handler would
  // leave focus mode at the same time.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      close()
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [open, close])

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    // Move focus into the panel so Esc and Tab stay inside it.
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  if (!siteConfig.features.shortcutHelp || !open) return null

  return (
    <div
      data-no-print
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
    >
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] motion-safe:animate-[fade-in_120ms_ease-out]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={L.title}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md overflow-hidden outline-none",
          "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--elevation-3)]",
          "motion-safe:animate-[palette-in_140ms_ease-out]",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Keyboard size={15} aria-hidden="true" className="text-accent-brand" />
          <h2 className="flex-1 text-small font-medium text-foreground">{L.title}</h2>
          <kbd className={KBD}>esc</kbd>
        </div>

        <div className="p-4">
          <p className="mb-4 text-[11px] text-muted-foreground">{L.hint}</p>

          <p className={GROUP_TITLE}>{L.groups.global}</p>
          <ul className="mb-5 space-y-2">
            {L.global.map((entry) => (
              <ShortcutRow key={entry.label} entry={entry} />
            ))}
          </ul>

          <p className={GROUP_TITLE}>{L.groups.palette}</p>
          <ul className="mb-5 space-y-2">
            {L.palette.map((entry) => (
              <ShortcutRow key={entry.label} entry={entry} />
            ))}
          </ul>

          {/* No key symbols here: these are dock buttons, not bindings. */}
          <p className={GROUP_TITLE}>{L.groups.reading}</p>
          <ul className="space-y-1.5">
            {L.reading.map((label) => (
              <li key={label} className="text-small text-muted-foreground">
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
