import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { BrandLockup } from "@/components/brand/logo"
import { siteConfig } from "@/lib/site.config"
import type { Lang } from "@/lib/data"

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<string, (props: { size?: number }) => React.ReactElement> = {
  x: XIcon,
  github: GithubIcon,
}

const COPY: Record<Lang, {
  tagline: string
  contentHeading: string
  aboutHeading: string
  quoteText: string
  originText: string
}> = {
  en: {
    tagline: "Telling life stories. Sharing what I've learned.",
    contentHeading: "Writing",
    aboutHeading: "Info",
    quoteText: "Writing is the only way I know to think clearly.",
    originText: "Crafted with care, from Vietnam",
  },
  vi: {
    tagline: "Kể chuyện cuộc đời. Chia sẻ những gì học được.",
    contentHeading: "Nội dung",
    aboutHeading: "Thông tin",
    quoteText: "Viết là cách duy nhất tôi biết để suy nghĩ rõ ràng.",
    originText: "Tận tâm từ Việt Nam",
  },
}

/**
 * Footer navigation comes from `lib/site.config.ts`, the single source of truth
 * shared with the header, the sitemap and the page metadata.
 *
 * Layout: four columns on desktop, two on tablet. On a phone the brand block
 * spans the full width above a two-column link grid, so links stay comfortably
 * tappable instead of being squeezed into one narrow column.
 */
export function Footer({ lang = "en" }: { lang?: Lang }) {
  const c = COPY[lang]
  const year = new Date().getFullYear()

  return (
    <footer data-reading-chrome className="mt-20 border-t border-border bg-surface-sunken sm:mt-24">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 md:grid-cols-4 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Vuong — home" className="inline-block">
              <BrandLockup size="md" />
            </Link>

            <p className="mt-5 max-w-xs text-small leading-relaxed text-muted-foreground">
              {c.tagline}
            </p>

            <ul className="mt-6 flex items-center gap-1.5">
              {siteConfig.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.key]
                if (!Icon) return null
                return (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
                    >
                      <Icon size={15} />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Content links */}
          <nav aria-label="Footer content links" className="col-span-1">
            <Eyebrow className="mb-4">{c.contentHeading}</Eyebrow>
            <ul className="flex flex-col gap-1">
              {siteConfig.footer.content.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* About links */}
          <nav aria-label="Footer about links" className="col-span-1">
            <Eyebrow className="mb-4">{c.aboutHeading}</Eyebrow>
            <ul className="flex flex-col gap-1">
              {siteConfig.footer.about.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quote */}
          <div className="col-span-2 md:col-span-1">
            <blockquote className="border-l-2 border-accent-brand/40 pl-4">
              <p className="text-small italic leading-relaxed text-muted-foreground">
                &ldquo;{c.quoteText}&rdquo;
              </p>
              <cite className="mt-2.5 block font-mono text-eyebrow uppercase not-italic tracking-[0.14em] text-muted-foreground">
                — {siteConfig.author.name}
              </cite>
            </blockquote>
          </div>
        </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 py-6 sm:flex-row">
          <p className="text-caption text-muted-foreground">
            © {year} {siteConfig.author.name} ({siteConfig.shortName}). All rights reserved.
          </p>
          <p className="font-mono text-eyebrow uppercase tracking-[0.14em] text-muted-foreground">
            {c.originText}
          </p>
        </div>
      </Container>
    </footer>
  )
}

