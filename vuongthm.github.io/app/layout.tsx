import type { Metadata, Viewport } from "next"
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { LangProvider } from "@/components/providers/lang-provider"
import { ReadingProvider } from "@/components/providers/reading-provider"
import { SmoothAnchors } from "@/components/layout/smooth-anchors"
import { Toaster } from "@/components/ui/sonner"
import { JsonLd } from "@/components/seo/json-ld"
import { personJsonLd, websiteJsonLd } from "@/lib/seo"
import { readingPreferencesInitScript } from "@/lib/reading-prefs"
import { siteConfig } from "@/lib/site.config"

/**
 * Content Security Policy.
 *
 * GitHub Pages cannot send response headers, so the policy has to travel as a
 * meta tag. It locks the page to same-origin resources: no third-party scripts,
 * no plugins, no form submissions off-site, no `<base>` hijacking.
 *
 * `'unsafe-inline'` for scripts is required by `next-themes`, which injects a
 * blocking script to apply the saved theme before first paint. The upgrade path
 * is a hash-based policy (`script-src 'self' 'sha256-…'`), which needs the hash
 * recomputed whenever that script changes.
 *
 * `frame-ancestors` is intentionally absent: the specification requires it to be
 * delivered as a header, and browsers ignore it inside a meta tag.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // React's development build uses eval() to reconstruct call stacks for its
  // error overlays, so the dev server needs it. Production never calls eval(),
  // so the deployed policy stays without the escape hatch.
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "upgrade-insecure-requests",
].join("; ")

// Initialize primary sans-serif font
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
})

// Headings and long-form reading. Newsreader carries a Vietnamese subset, which
// matters because every chapter and note is bilingual.
const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  variable: "--font-newsreader",
  display: "swap",
})

// Initialize monospace font for code blocks
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

// Defined once in `lib/site.config.ts` so the name, URL and description are
// never out of sync between metadata, footer, sitemap and JSON-LD.
export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description[siteConfig.defaultLang],
  authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
  creator: siteConfig.author.name,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
    languages: {
      en: "/en/",
      vi: "/vi/",
      "x-default": `/${siteConfig.defaultLang}/`,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.ogLocale[siteConfig.defaultLang],
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description[siteConfig.defaultLang],
  },
  twitter: {
    card: "summary_large_image",
    creator: `@${siteConfig.author.handle}`,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" }, // Scalable vector logo for browser tabs
    ],
    apple: "/apple-icon.png",
  },
}

// Config theme viewport options
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} bg-surface`}
    >
      <head>
        {/* Must be the first meta tag so it applies to everything that follows. */}
        <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Applies the saved reading preferences before first paint, so the text
          never reflows from the default size to the reader's chosen one.
          Errors are swallowed inside the script — preferences are cosmetic.
        */}
        <script dangerouslySetInnerHTML={{ __html: readingPreferencesInitScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <JsonLd data={websiteJsonLd(siteConfig.defaultLang)} />
        <JsonLd data={personJsonLd()} />
        <ThemeProvider>
          <LangProvider>
            <ReadingProvider>
              <SmoothAnchors />
              {children}
              <Toaster richColors position="bottom-right" />
            </ReadingProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}