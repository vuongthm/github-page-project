"use client"

import { useCallback, useMemo } from "react"
import { useLang } from "@/components/providers/lang-provider"
import { getMessages, type Messages } from "@/lib/i18n"
import type { Lang } from "@/lib/data"

/**
 * Unified i18n access for client components.
 *
 * The codebase previously had two parallel systems: `lib/i18n.ts` (JSON
 * dictionaries) and per-page `COPY` / `LABELS` objects inlined at the bottom
 * of each file. That meant changing a label could require editing a dozen
 * files. Everything now goes through this hook, so all copy has exactly one
 * home: `i18n/en.json` and `i18n/vi.json`.
 */
export interface I18n {
  lang: Lang
  messages: Messages
  /** Dot-path lookup: `t("nav.stories")`. Falls back to the key itself. */
  t: (key: string) => string
  /** Picks a value from an inline localized object, e.g. `pick(siteConfig.description)`. */
  pick: <T>(values: Record<Lang, T>) => T
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

function resolve(messages: Messages, key: string): string {
  const parts = key.split(".")
  let current: unknown = messages

  for (const part of parts) {
    if (current == null || typeof current !== "object") return key
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === "string" ? current : key
}

export function useI18n(): I18n {
  const { lang } = useLang()
  const messages = useMemo(() => getMessages(lang), [lang])

  const t = useCallback((key: string) => resolve(messages, key), [messages])

  const pick = useCallback(
    <T,>(values: Record<Lang, T>): T => values[lang] ?? values.en,
    [lang],
  )

  const formatDate = useCallback(
    (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        ...options,
      }).format(typeof value === "string" ? new Date(value) : value),
    [lang],
  )

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", options).format(value),
    [lang],
  )

  return { lang, messages, t, pick, formatDate, formatNumber }
}
