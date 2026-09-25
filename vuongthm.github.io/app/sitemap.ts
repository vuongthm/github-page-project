import type { MetadataRoute } from "next"
import {
  getAllTags,
  getChaptersBySeriesSlug,
  getVisibleNotes,
  getVisibleSeries,
  type Lang,
} from "@/lib/data"
import { siteConfig, buildSitemapAlternates } from "@/lib/site.config"

/**
 * Static sitemap.
 *
 * A static export cannot serve this dynamically, so Next renders it at build
 * time. Every localized route is enumerated from the generated content data,
 * which means adding a chapter or a note to a content repo automatically adds
 * it here — no manual list to keep in sync.
 */

const STATIC_PATHS = ["", "/stories", "/notes", "/tags", "/about"] as const

// Required for route handlers under `output: "export"`: the sitemap is rendered
// once at build time and served as a plain file.
export const dynamic = "force-static"

function absolute(path: string, lang: Lang): string {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "")
  return `${siteConfig.url}/${lang}${clean}/`
}

function entry(
  path: string,
  lang: Lang,
  priority: number,
  lastModified?: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: absolute(path, lang),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency: "monthly",
    priority,
    alternates: { languages: buildSitemapAlternates(path) },
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const lang of siteConfig.langs) {
    for (const path of STATIC_PATHS) {
      entries.push(entry(path, lang, path === "" ? 1 : 0.8))
    }

    for (const series of getVisibleSeries(lang)) {
      entries.push(entry(`/stories/${series.slug}`, lang, 0.7, series.startDate))

      for (const chapter of getChaptersBySeriesSlug(series.slug, lang)) {
        entries.push(entry(`/stories/${series.slug}/${chapter.slug}`, lang, 0.6, chapter.date))
      }
    }

    for (const note of getVisibleNotes(lang)) {
      entries.push(entry(`/notes/${note.slug}`, lang, 0.6, note.date))
    }

    for (const { tag } of getAllTags(lang)) {
      entries.push(entry(`/tags/${tag}`, lang, 0.4))
    }
  }

  return entries
}
