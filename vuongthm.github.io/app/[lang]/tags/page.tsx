"use client"

import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useLang } from "@/components/providers/lang-provider"
import { getAllTags } from "@/lib/data"
import { cn } from "@/lib/utils"

type SortMode = "frequency" | "alpha"

const COPY = {
  en: {
    eyebrow: "Topics",
    heading: "Tags",
    description: "All topics across stories and notes — sorted by frequency or alphabetically.",
    sortLabel: "Sort tags",
    sortFreq: "By frequency",
    sortAlpha: "A–Z",
  },
  vi: {
    eyebrow: "Chủ đề",
    heading: "Thẻ",
    description: "Tất cả chủ đề trong chuyện kể và ghi chú — theo tần suất hoặc A–Z.",
    sortLabel: "Sắp xếp thẻ",
    sortFreq: "Tần suất",
    sortAlpha: "A–Z",
  },
}

export default function TagsPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [sort, setSort] = useState<SortMode>("frequency")

  const allTags = getAllTags(lang)
  const sorted =
    sort === "frequency"
      ? allTags
      : [...allTags].sort((a, b) => a.tag.localeCompare(b.tag))

  const maxCount = allTags[0]?.count ?? 1

  return (
    <>
      <Header />

      <main className="pt-14">
        <Container className="pt-10 pb-8 sm:pt-14">
          {/* A page title is an `<h1>`, rendered here rather than through
              SectionHeading, which is h2/h3 by design. */}
          <Eyebrow tone="brand">{c.eyebrow}</Eyebrow>
          <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
            {c.heading}
          </h1>
          <p className="max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">
            {c.description}
          </p>
        </Container>

        <Container className="pb-[var(--space-section)]">
          <div
            role="group"
            aria-label={c.sortLabel}
            className="mb-8 flex items-center gap-2 sm:justify-start"
          >
            {(
              [
                { mode: "frequency" as SortMode, label: c.sortFreq },
                { mode: "alpha" as SortMode, label: c.sortAlpha },
              ]
            ).map((option) => (
              <button
                key={option.mode}
                type="button"
                onClick={() => setSort(option.mode)}
                aria-pressed={sort === option.mode}
                className={cn(
                  "tap-target rounded-[var(--radius)] px-3.5 text-small font-medium transition-colors duration-150",
                  sort === option.mode
                    ? "bg-accent-brand text-accent-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Font size still encodes frequency: the eye finds the big topics
              without reading a single number. The card surface and hover follow
              the same tokens as every other chip on the site. */}
          <div className="flex flex-wrap gap-2.5 sm:justify-start">
            {sorted.map(({ tag, count }) => {
              const scale = 0.8 + (count / maxCount) * 0.3
              return (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 transition-colors duration-150 hover:border-accent-brand/40 hover:bg-accent-brand/5"
                  style={{ fontSize: `${scale}rem` }}
                >
                  <span className="text-foreground transition-colors duration-150 group-hover:text-accent-brand">
                    {tag}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
                </Link>
              )
            })}
          </div>
        </Container>
      </main>

      <Footer lang={lang} />
    </>
  )
}