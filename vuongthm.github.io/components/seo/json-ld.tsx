import { serializeJsonLd } from "@/lib/seo"

/**
 * Renders a JSON-LD block.
 *
 * `type="application/ld+json"` is data, not executable script, so it is not
 * subject to `script-src` in the Content Security Policy. The payload is
 * serialized with `<` escaped, which prevents a string value from closing the
 * surrounding tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
