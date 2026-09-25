import { ArrowRight, BookOpen, FolderGit2, Images, NotebookPen, Sparkles, User } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CommandPalette } from "@/components/features/command-palette"
import { ContinueReadingRow } from "@/components/home/continue-reading-row"
import { HubCard } from "@/components/home/hub-card"
import { NoteCard } from "@/components/content/note-card"
import { Avatar } from "@/components/ui/avatar"
import { ChipLink } from "@/components/ui/chip"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Link } from "@/components/ui/link"
import { SectionHeading, SectionRule } from "@/components/ui/section"
import { Reveal } from "@/components/motion/reveal"
import {
  getAllTags,
  getVisibleAlbums,
  getVisibleNotes,
  getVisibleSeries,
  type Lang,
} from "@/lib/data"
import { siteConfig } from "@/lib/site.config"

/**
 * Home page — a SERVER component.
 *
 * It used to be a client component, which meant the whole content tree was
 * bundled and hydrated just to render a list. It holds no state now: the
 * interactive pieces (Header, Reveal, BackToTop) are client components imported
 * in, so this markup is rendered once at build time.
 *
 * Layout follows the F-pattern: identity top-left, then hubs scanning left to
 * right, then a narrower column of writing and tags further down.
 */

/**
 * Copy as key -> { en, vi } rather than one object per language: adding a string
 * is one line, and a missing translation is a type error instead of a blank.
 */
const TEXT = {
  eyebrow: { en: "Stories & notes from Vietnam", vi: "Chuyện kể & ghi chú từ Việt Nam" },
  tagline: {
    en: "Telling life stories. Sharing what I've learned.",
    vi: "Kể chuyện cuộc đời. Chia sẻ những gì học được.",
  },
  ctaStories: { en: "Read Stories", vi: "Đọc chuyện kể" },
  ctaNotes: { en: "Browse Notes", vi: "Xem ghi chú" },
  hubsEyebrow: { en: "Explore", vi: "Khám phá" },
  hubsHeading: { en: "Where to go next", vi: "Đi đâu tiếp" },
  hubsLead: {
    en: "Four places to wander. Each one tells you what is inside before you click.",
    vi: "Bốn nơi để ghé. Mỗi nơi cho bạn biết có gì bên trong trước khi bấm vào.",
  },
  stories: { en: "Stories", vi: "Chuyện kể" },
  storiesDesc: {
    en: "Long-form memoirs, written one chapter at a time.",
    vi: "Hồi ký dài, viết từng chương một.",
  },
  notes: { en: "Notes", vi: "Ghi chú" },
  notesDesc: {
    en: "Short technical notes, mostly about networks.",
    vi: "Ghi chú kỹ thuật ngắn, phần lớn về mạng.",
  },
  album: { en: "Album", vi: "Album" },
  albumDesc: {
    en: "Photos and videos, kept private behind a password.",
    vi: "Ảnh và video, để riêng tư sau mật khẩu.",
  },
  about: { en: "About", vi: "Về tôi" },
  aboutDesc: {
    en: "Who I am, where I come from, and how I got here.",
    vi: "Tôi là ai, đến từ đâu, và đã đi tới đây thế nào.",
  },
  projects: { en: "Projects", vi: "Dự án" },
  projectsDesc: {
    en: "Things I have built, with notes on the trade-offs.",
    vi: "Những thứ tôi đã làm, kèm ghi chú về đánh đổi.",
  },
  askAi: { en: "Ask AI", vi: "Hỏi AI" },
  askAiDesc: {
    en: "Ask questions about the page you are reading.",
    vi: "Đặt câu hỏi về trang bạn đang đọc.",
  },
  latestEyebrow: { en: "Recent", vi: "Gần đây" },
  latestHeading: { en: "Latest writing", vi: "Bài viết mới" },
  tagsHeading: { en: "Browse by tag", vi: "Xem theo thẻ" },
  viewAll: { en: "View all", vi: "Xem tất cả" },
  empty: { en: "Nothing published here yet.", vi: "Chưa có nội dung nào ở đây." },
  seriesLabel: { en: "series", vi: "bộ" },
  notesLabel: { en: "notes", vi: "ghi chú" },
  albumsLabel: { en: "albums", vi: "album" },
} as const

type TextKey = keyof typeof TEXT

function text(lang: Lang) {
  return (key: TextKey) => TEXT[key][lang]
}

/** Tag chips grow with frequency — a cloud that actually communicates volume. */
function tagSize(count: number, max: number): string {
  if (max <= 1) return "text-small"
  const ratio = count / max
  if (ratio > 0.8) return "text-h3"
  if (ratio > 0.55) return "text-lead"
  if (ratio > 0.3) return "text-body"
  return "text-small"
}

export default async function HomePage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const t = text(lang)

  const series = getVisibleSeries(lang)
  const notes = getVisibleNotes(lang)
  const albums = getVisibleAlbums(lang)
  const tags = getAllTags(lang)
  const maxTagCount = tags[0]?.count ?? 1

  /*
    Hubs advertise live counts, so the home page always describes what is
    actually published instead of hardcoded copy. `count` is optional because the
    About hub has nothing to count.
  */
  const hubs: Array<{
    key: string
    href: string
    title: string
    description: string
    icon: typeof BookOpen
    count?: number
    countLabel?: string
    latest?: string
  }> = [
    {
      key: "stories",
      href: "/stories",
      title: t("stories"),
      description: t("storiesDesc"),
      icon: BookOpen,
      count: series.length,
      countLabel: t("seriesLabel"),
      latest: series[0]?.title,
    },
    {
      key: "notes",
      href: "/notes",
      title: t("notes"),
      description: t("notesDesc"),
      icon: NotebookPen,
      count: notes.length,
      countLabel: t("notesLabel"),
      latest: notes[0]?.title,
    },
    {
      key: "album",
      href: "/my-album",
      title: t("album"),
      description: t("albumDesc"),
      icon: Images,
      count: albums.length,
      countLabel: t("albumsLabel"),
    },
    {
      key: "about",
      href: "/about",
      title: t("about"),
      description: t("aboutDesc"),
      icon: User,
    },
  ]

  // Feature-flagged hubs: later phases only need to flip a switch in site.config.
  if (siteConfig.features.projects) {
    hubs.push({
      key: "projects",
      href: "/projects",
      title: t("projects"),
      description: t("projectsDesc"),
      icon: FolderGit2,
    })
  }
  if (siteConfig.features.aiAssistant) {
    hubs.push({
      key: "ask-ai",
      href: "/ask",
      title: t("askAi"),
      description: t("askAiDesc"),
      icon: Sparkles,
    })
  }

  const latest = notes.slice(0, 3)

  return (
    <>
      <Header />
      <main id="main-content" className="pt-[var(--header-h)]">
        {/* ---- Hero: identity, one line, two actions ------------------- */}
        <Container className="pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-16">
            <div className="max-w-2xl">
              <Eyebrow tone="brand">{t("eyebrow")}</Eyebrow>

              <h1 className="mt-3 text-display text-foreground">
                {siteConfig.name}
                <span className="text-accent-brand">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">
                {t("tagline")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/stories"
                  className="group inline-flex tap-target items-center gap-2 rounded-[var(--radius)] bg-accent-brand px-5 text-small font-medium text-accent-brand-foreground transition-opacity duration-150 hover:opacity-90"
                >
                  {t("ctaStories")}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/notes"
                  className="inline-flex tap-target items-center gap-2 rounded-[var(--radius)] border border-border-strong px-5 text-small font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                >
                  {t("ctaNotes")}
                </Link>
                {/* Keyboard-first jump-off point, visible instead of implied. */}
                {siteConfig.features.commandPalette ? (
                  <CommandPalette lang={lang} mode="inline" />
                ) : null}
              </div>
            </div>

            <Avatar
              src="/avatar.webp"
              name={siteConfig.author.name}
              size="xl"
              priority
              className="order-first md:order-last"
            />
          </div>
        </Container>

        {/* ---- Resume: rendered only once a chapter or note has been visited.
             Directly under the hero, so it is the first thing a returning reader
             sees, and it collapses to nothing for a first-time visitor. ------- */}
        {siteConfig.features.continueReading ? <ContinueReadingRow lang={lang} /> : null}

        <SectionRule />

        {/* ---- Bento hubs: what the site contains, with live counts ----- */}
        <Container className="py-[var(--space-section)]">
          <SectionHeading
            eyebrow={t("hubsEyebrow")}
            title={t("hubsHeading")}
            description={t("hubsLead")}
          />

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub, index) => (
              <Reveal key={hub.key} delay={index * 70} className="h-full">
                <HubCard
                  href={hub.href}
                  title={hub.title}
                  description={hub.description}
                  icon={hub.icon}
                  count={hub.count}
                  countLabel={hub.countLabel}
                  latest={hub.latest}
                  // The first tile carries the emphasis so the eye lands
                  // somewhere deliberate, then scans left to right.
                  emphasis={index === 0}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </Container>

        <SectionRule />

        {/* ---- Latest writing ------------------------------------------ */}
        <Container className="py-[var(--space-section)]">
          <SectionHeading
            eyebrow={t("latestEyebrow")}
            title={t("latestHeading")}
            action={
              <Link
                href="/notes"
                className="group inline-flex tap-target items-center gap-1.5 text-small font-medium text-accent-brand"
              >
                {t("viewAll")}
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            }
          />

          <Reveal className="mt-6">
            {latest.length === 0 ? (
              <p className="text-small text-muted-foreground">{t("empty")}</p>
            ) : (
              <div className="divide-y divide-border">
                {latest.map((note) => (
                  <NoteCard key={note.slug} note={note} lang={lang} variant="compact" />
                ))}
              </div>
            )}
          </Reveal>
        </Container>

        {/* ---- Tag cloud ----------------------------------------------- */}
        {tags.length > 0 ? (
          <>
            <SectionRule />
            <Container className="py-[var(--space-section)]">
              <SectionHeading
                eyebrow={t("hubsEyebrow")}
                title={t("tagsHeading")}
                action={
                  <Link
                    href="/tags"
                    className="group inline-flex tap-target items-center gap-1.5 text-small font-medium text-accent-brand"
                  >
                    {t("viewAll")}
                    <ArrowRight
                      size={13}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                }
              />

              {/* Size varies with frequency, so the cloud carries information
                  rather than being decoration. */}
              <Reveal className="mt-7 flex flex-wrap items-center gap-2.5">
                {tags.slice(0, 24).map((tag) => (
                  <ChipLink
                    key={tag.tag}
                    href={`/tags/${tag.tag}`}
                    className={`px-3 py-1 ${tagSize(tag.count, maxTagCount)}`}
                  >
                    {tag.tag}
                    <span className="ml-1.5 font-mono text-eyebrow opacity-60">{tag.count}</span>
                  </ChipLink>
                ))}
              </Reveal>
            </Container>
          </>
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  )
}

