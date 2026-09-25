import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site.config"

// Required for route handlers under `output: "export"`.
export const dynamic = "force-static"

/**
 * robots.txt, generated at build time.
 *
 * `/media/` is deliberately *allowed*: those are the article images, and
 * blocking them would remove the site from image search results. Only build
 * artefacts and the private album index are kept out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/my-album/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
