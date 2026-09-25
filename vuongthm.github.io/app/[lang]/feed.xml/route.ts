import { getVisibleNotes, getVisibleSeries, type Lang } from "@/lib/data"
import { siteConfig } from "@/lib/site.config"

/**
 * Per-locale RSS feed.
 *
 * `output: "export"` requires route handlers to be fully static, hence
 * `force-static` and `generateStaticParams`.
 *
 * Only PUBLIC content is included. `getVisibleSeries` / `getVisibleNotes` are
 * the same selectors the pages use, and locked items are excluded here by
 * checking `isLocked` — a feed reader would otherwise cache private text in a
 * place the reader cannot un-publish. Bodies are never included: an excerpt is
 * enough for a feed and keeps private prose out of third-party caches.
 */

export const dynamic = "force-static"

export function generateStaticParams() {
  return siteConfig.langs.map((lang) => ({ lang }))
}

const TITLE = {
  en: "Vuong — Stories & Notes",
  vi: "Vương — Chuyện kể & Ghi chú",
} as const

const DESCRIPTION = {
  en: "Long-form memoirs and short technical notes.",
  vi: "Hồi ký dài và ghi chú kỹ thuật ngắn.",
} as const

/** XML text escaping. Feed content is data, so every value passes through here. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function item(options: {
  title: string
  description: string
  url: string
  date: string
  tags?: string[]
  kind: "series" | "note"
}): string {
  const pubDate = options.date ? new Date(options.date).toUTCString() : new Date().toUTCString()

  return [
    "    <item>",
    `      <title>${escapeXml(options.title)}</title>`,
    `      <link>${escapeXml(options.url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(options.url)}</guid>`,
    `      <pubDate>${pubDate}</pubDate>`,
    `      <category>${options.kind}</category>`,
    ...(options.tags ?? []).map((tag) => `      <category>${escapeXml(tag)}</category>`),
    `      <description>${escapeXml(options.description)}</description>`,
    "    </item>",
  ].join("\n")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
): Promise<Response> {
  const { lang: raw } = await params
  // Next types a dynamic route param as a plain string; narrow it to the
  // supported locales before using it to index the translation tables.
  const lang: Lang = (siteConfig.langs as readonly string[]).includes(raw) ? (raw as Lang) : "en"
  const base = `${siteConfig.url}/${lang}`

  // Locked items are filtered out, not merely hidden in the UI.
  const series = getVisibleSeries(lang).filter((item) => !item.isLocked)
  const notes = getVisibleNotes(lang).filter((item) => !item.isLocked)

  const entries = [
    ...series.map((item) => ({
      title: item.title,
      description: item.description,
      url: `${base}/stories/${item.slug}/`,
      date: item.startDate,
      tags: item.tags,
      kind: "series" as const,
    })),
    ...notes.map((item) => ({
      title: item.title,
      description: item.description,
      url: `${base}/notes/${item.slug}/`,
      date: item.date,
      tags: item.tags,
      kind: "note" as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(TITLE[lang] ?? TITLE.en)}</title>`,
    `    <link>${escapeXml(base)}/</link>`,
    `    <description>${escapeXml(DESCRIPTION[lang] ?? DESCRIPTION.en)}</description>`,
    `    <language>${siteConfig.htmlLang[lang] ?? "en"}</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    entries.map(item).join("\n"),
    "  </channel>",
    "</rss>",
  ].join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
