import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { PageTransition } from "@/components/layout/page-transition"
import { FloatDock } from "@/components/features/float-dock"
import { CommandPalette } from "@/components/features/command-palette"
import { ContinueReadingTracker } from "@/components/features/continue-reading-tracker"
import { ShortcutHelp } from "@/components/features/shortcut-help"
import { siteConfig } from "@/lib/site.config"

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "vi" }]
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

/**
 * Advertises the RSS feed so feed readers and browsers can discover it from any
 * page. Routed through metadata rather than a hand-written <link> so it stays in
 * sync with the locale.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params

  return {
    alternates: {
      types: {
        "application/rss+xml": `/${lang}/feed.xml`,
      },
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: LayoutProps) {
  // Unwrap Promise params with await, per the Next.js 15+ & 16 specification
  const { lang } = await params

  // Protection filter to prevent Next.js from incorrectly compiling static paths into dynamic pages
  if (lang !== "en" && lang !== "vi") {
    notFound()
  }

  // Replays the CSS entrance animation on each client-side navigation.
  // The float dock is mounted once here rather than per page, and is the only
  // component allowed to render a fixed control.
  return (
    <PageTransition>
      {children}
      {/* One global palette instance owns Ctrl/Cmd+K and the dialog; pages that
          want a visible entry point mount the same component with mode="inline". */}
      <CommandPalette lang={lang} />
      {/* Records the last chapter or note visited. Mounted here rather than on
          each detail page so a new long-form route is covered automatically. */}
      <ContinueReadingTracker lang={lang} />
      {/* "?" reference for the keyboard behaviour added in Phase 2 and 3. */}
      <ShortcutHelp lang={lang} />
      <FloatDock lang={lang} />
    </PageTransition>
  )
}