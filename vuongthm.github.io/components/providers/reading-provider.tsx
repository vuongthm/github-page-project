"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  applyReadingPreferences,
  defaultReadingPreferences,
  readReadingPreferences,
  stepScale,
  writeReadingPreferences,
  type ReadingPreferences,
} from "@/lib/reading-prefs"
import { siteConfig } from "@/lib/site.config"

/**
 * Reader preferences (font scale + focus mode).
 *
 * State lives here and is published to the document as CSS custom properties,
 * so any component can consume it (`var(--reading-scale)`) without subscribing
 * to React state. That keeps re-renders out of the scroll path.
 */

interface ReadingContextValue {
  prefs: ReadingPreferences
  /** False when `siteConfig.features.readingToolbar` is off. */
  enabled: boolean
  increaseScale: () => void
  decreaseScale: () => void
  toggleFocus: () => void
  reset: () => void
}

const ReadingContext = createContext<ReadingContextValue | null>(null)

export function ReadingProvider({ children }: { children: ReactNode }) {
  // Start from the defaults so the server-rendered markup matches the first
  // client render; the stored values are applied right after mount.
  const [prefs, setPrefs] = useState<ReadingPreferences>(defaultReadingPreferences)

  useEffect(() => {
    setPrefs(readReadingPreferences())
  }, [])

  useEffect(() => {
    applyReadingPreferences(prefs)
  }, [prefs])

  const update = useCallback((next: ReadingPreferences) => {
    setPrefs(next)
    writeReadingPreferences(next)
  }, [])

  const value = useMemo<ReadingContextValue>(
    () => ({
      prefs,
      enabled: siteConfig.features.readingToolbar,
      increaseScale: () => update({ ...prefs, scale: stepScale(prefs.scale, 1) }),
      decreaseScale: () => update({ ...prefs, scale: stepScale(prefs.scale, -1) }),
      toggleFocus: () => update({ ...prefs, focus: !prefs.focus }),
      reset: () => update(defaultReadingPreferences),
    }),
    [prefs, update],
  )

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>
}

export function useReading(): ReadingContextValue {
  const context = useContext(ReadingContext)
  if (!context) {
    throw new Error("useReading() must be used inside <ReadingProvider>")
  }
  return context
}
