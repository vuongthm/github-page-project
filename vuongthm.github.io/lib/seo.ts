import { siteConfig } from "./site.config"
import type { Lang } from "./data"

/**
 * SEO helpers shared by every route.
 *
 * Centralising canonical URLs, hreflang alternates and JSON-LD here means a
 * new page only has to call `buildAlternates()` and drop in `<JsonLd>`, so
 * every future route is automatically consistent.
 */

export interface Alternates {
  canonical: string
  languages: Record<string, string>
}

/**
 * Builds the canonical URL and the hreflang map for a locale-less path.
 * `buildAlternates("/stories", "vi")` → canonical `/vi/stories/`,
 * languages `{ en: "/en/stories/", vi: "/vi/stories/", "x-default": "/en/stories/" }`
 */
export function buildAlternates(path: string, lang: Lang): Alternates {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "")
  const withLang = (target: Lang) => `/${target}${clean}/`

  const languages: Record<string, string> = {}
  for (const target of siteConfig.langs) {
    languages[target] = `${siteConfig.url}${withLang(target)}`
  }
  languages["x-default"] = `${siteConfig.url}${withLang(siteConfig.defaultLang)}`

  return {
    canonical: `${siteConfig.url}${withLang(lang)}`,
    languages,
  }
}

/** Absolute URL for a locale-less path. */
export function absoluteUrl(path: string, lang: Lang): string {
  return buildAlternates(path, lang).canonical
}

/* ------------------------------------------------------------------ *
 * JSON-LD
 * ------------------------------------------------------------------ */

type JsonLdNode = Record<string, unknown>

function publisherNode(): JsonLdNode {
  return {
    "@type": "Person",
    name: siteConfig.author.name,
    alternateName: siteConfig.author.handle,
    url: siteConfig.url,
  }
}

export function personJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name,
    alternateName: siteConfig.author.handle,
    url: siteConfig.url,
    description: siteConfig.description[siteConfig.defaultLang],
    sameAs: siteConfig.socials.map((social) => social.href),
  }
}

export function websiteJsonLd(lang: Lang): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description[lang],
    inLanguage: siteConfig.htmlLang[lang],
    author: publisherNode(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/${lang}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export interface ArticleJsonLdInput {
  title: string
  description?: string
  url: string
  lang: Lang
  datePublished?: string
  /** Chapter or note body; used for word count and reading time. */
  body?: string
  tags?: string[]
  section?: string
}

export function articleJsonLd({
  title,
  description,
  url,
  lang,
  datePublished,
  body,
  tags,
  section,
}: ArticleJsonLdInput): JsonLdNode {
  const wordCount = body ? body.trim().split(/\s+/).filter(Boolean).length : undefined

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(description ? { description } : {}),
    url,
    mainEntityOfPage: url,
    inLanguage: siteConfig.htmlLang[lang],
    author: publisherNode(),
    publisher: publisherNode(),
    ...(datePublished ? { datePublished } : {}),
    ...(wordCount ? { wordCount } : {}),
    ...(tags?.length ? { keywords: tags.join(", ") } : {}),
    ...(section ? { articleSection: section } : {}),
  }
}

export function breadcrumbJsonLd(trail: { name: string; url: string }[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Serialises JSON-LD safely for embedding in a <script> tag.
 * `JSON.stringify` alone can emit `</script>` inside a string value.
 */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
