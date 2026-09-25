import type { Lang } from "./data"

/**
 * Single source of truth for everything that is *not* content.
 *
 * Rule of thumb: if you would have to touch more than one component to change
 * it, it belongs in this file. Navigation, social links, feature flags and
 * reading defaults all live here so the UI layer stays declarative.
 */

/** A piece of copy that exists in every supported locale. */
export type Localized<T = string> = Record<Lang, T>

export interface NavItem {
  /** Stable identifier, also used as the i18n key when `label` is omitted. */
  key: string
  /** Locale-less href. `components/ui/link.tsx` injects the `/en` or `/vi` prefix. */
  href: string
  label: Localized
}

export interface SocialLink {
  key: "github" | "x" | "mail" | "linkedin"
  href: string
  label: string
}

export interface FeatureFlags {
  /** Ctrl/Cmd+K command palette. */
  commandPalette: boolean
  /** Reader preferences: font scale, width and focus mode. */
  readingToolbar: boolean
  /** "Resume where you left off" banner on the home page. */
  continueReading: boolean
  /** Estimated reading time on chapter and note cards. */
  readingTime: boolean
  /** Table of contents panel on long-form pages. */
  tableOfContents: boolean
  /** Scroll-reveal and hero parallax. Always disabled for reduced motion. */
  motion: boolean
  /** Personal projects section (Phase 4). */
  projects: boolean
  /** AI assistant dock (Phase 5). */
  aiAssistant: boolean
  /** Saved-items page (Phase 3). */
  bookmarks: boolean
  /** Per-locale RSS feed, public content only (Phase 3). */
  rss: boolean
  /** ? opens the keyboard shortcut reference (Phase 3). */
  shortcutHelp: boolean
}

export interface SiteConfig {
  name: string
  shortName: string
  /** Canonical origin, no trailing slash. Used for metadataBase and sitemap. */
  url: string
  defaultLang: Lang
  langs: readonly Lang[]
  author: { name: string; handle: string; url: string }
  description: Localized
  /** Open Graph locales per language. */
  ogLocale: Record<Lang, string>
  /** Rendered in the <html lang> attribute. */
  htmlLang: Record<Lang, string>
  socials: SocialLink[]
  nav: NavItem[]
  footer: { content: NavItem[]; about: NavItem[] }
  features: FeatureFlags
  reading: {
    /** Reader font scale is stored as a multiplier of the base size. */
    minScale: number
    maxScale: number
    step: number
    defaultScale: number
    /** Max content width in px for the reading column. */
    widths: number[]
  }
}

export const siteConfig: SiteConfig = {
  name: "Vuong",
  shortName: "vuongthm",
  url: "https://vuongthm.com",
  defaultLang: "en",
  langs: ["en", "vi"] as const,

  author: {
    name: "Vuong",
    handle: "vuongthm",
    url: "https://vuongthm.com/about",
  },

  description: {
    en: "Personal blog by Vuong (vuongthm) — life stories and lessons learned.",
    vi: "Blog cá nhân của Vuong (vuongthm) — kể chuyện cuộc đời và chia sẻ những điều học được.",
  },

  ogLocale: { en: "en_US", vi: "vi_VN" },
  htmlLang: { en: "en", vi: "vi" },

  socials: [
    { key: "github", href: "https://github.com/vuongthm", label: "GitHub" },
    { key: "x", href: "https://twitter.com/vuongthm", label: "Twitter / X" },
  ],

  nav: [
    { key: "home", href: "/", label: { en: "Home", vi: "Trang chủ" } },
    { key: "stories", href: "/stories", label: { en: "Stories", vi: "Chuyện kể" } },
    { key: "notes", href: "/notes", label: { en: "Notes", vi: "Ghi chú" } },
    { key: "tags", href: "/tags", label: { en: "Tags", vi: "Thẻ" } },
    { key: "about", href: "/about", label: { en: "About", vi: "Về tôi" } },
  ],

  footer: {
    content: [
      { key: "stories", href: "/stories", label: { en: "Stories", vi: "Chuyện kể" } },
      { key: "notes", href: "/notes", label: { en: "Notes", vi: "Ghi chú" } },
      { key: "tags", href: "/tags", label: { en: "Tags", vi: "Thẻ" } },
      { key: "album", href: "/my-album", label: { en: "Album", vi: "Album" } },
    ],
    about: [
      { key: "about", href: "/about", label: { en: "About me", vi: "Về tôi" } },
      { key: "hometown", href: "/about#hometown", label: { en: "Hometown", vi: "Quê hương" } },
      { key: "timeline", href: "/about#timeline", label: { en: "Timeline", vi: "Các mốc" } },
    ],
  },

  features: {
    commandPalette: true,
    readingToolbar: true,
    continueReading: true,
    readingTime: true,
    tableOfContents: true,
    motion: true,
    projects: false,
    aiAssistant: false,
    bookmarks: true,
    rss: true,
    shortcutHelp: true,
  },

  reading: {
    minScale: 0.9,
    maxScale: 1.3,
    step: 0.05,
    defaultScale: 1,
    widths: [620, 680, 760],
  },
}

/** Helper so components never hardcode a locale prefix. */
export function localizeHref(href: string, lang: Lang): string {
  if (!href.startsWith("/")) return href
  if (href.startsWith("/en") || href.startsWith("/vi")) return href
  return `/${lang}${href === "/" ? "" : href}`
}

/** Generates the static params matrix every localized route needs. */
export function langParams(): { lang: Lang }[] {
  return siteConfig.langs.map((lang) => ({ lang }))
}

/**
 * Absolute hreflang map for a locale-less path.
 *
 * Used by `app/sitemap.ts` so every entry advertises its translations, which is
 * what stops Google treating `/en/stories/x` and `/vi/stories/x` as duplicates.
 */
export function buildSitemapAlternates(path: string): Record<string, string> {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "")

  const languages: Record<string, string> = {}
  for (const lang of siteConfig.langs) {
    languages[lang] = `${siteConfig.url}/${lang}${clean}/`
  }
  languages["x-default"] = `${siteConfig.url}/${siteConfig.defaultLang}${clean}/`

  return languages
}
