"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SeriesCard } from "@/components/content/series-card"
import { Container } from "@/components/ui/container"
import { Eyebrow } from "@/components/ui/eyebrow"
import { useLang } from "@/components/providers/lang-provider"
import { getVisibleSeries } from "@/lib/data"
import { cn } from "@/lib/utils"

const COPY = {
  en: { eyebrow: "Narrative", heading: "Stories", description: "Personal narrative series split into chapters — childhood, the reckless years, and a journey of growth.", all: "All", ongoing: "Ongoing", completed: "Completed", noResults: "No stories found.", filterLabel: "Filter stories" },
  vi: { eyebrow: "Truyện", heading: "Chuyện kể", description: "Những câu chuyện cá nhân được chia thành các chương — về tuổi thơ, những năm tháng bất kham, và hành trình trưởng thành.", all: "Tất cả", ongoing: "Đang viết", completed: "Hoàn thành", noResults: "Không tìm thấy chuyện nào.", filterLabel: "Lọc chuyện kể" },
}

type Filter = "all" | "ongoing" | "completed"

export default function StoriesPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = getVisibleSeries(lang).filter((s) => {
    if (filter === "all") return true
    return s.status === filter
  })

  return (
    <>
      <Header />
      <main className="pt-14">
        <Container className="pt-12 pb-8 sm:pt-16 sm:pb-10">
          {/* Page title, same formula as the other list pages. */}
          <Eyebrow tone="brand">{c.eyebrow}</Eyebrow>
          <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
            {c.heading}
          </h1>
          <p className="max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">
            {c.description}
          </p>

          {/* Segmented filter. The active segment sits on a raised surface
              instead of changing size, so switching never shifts the row. */}
          <div
            role="group"
            aria-label={c.filterLabel}
            className="mt-6 flex w-fit items-center gap-1 rounded-[var(--radius-lg)] bg-surface-sunken p-1"
          >
            {(
              [
                { value: "all" as Filter, label: c.all },
                { value: "ongoing" as Filter, label: c.ongoing },
                { value: "completed" as Filter, label: c.completed },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={cn(
                  "tap-target rounded-[var(--radius)] px-4 text-small font-medium transition-colors duration-150",
                  filter === option.value
                    ? "bg-surface text-foreground shadow-[var(--elevation-1)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Container>

        <Container className="pb-[var(--space-section)]">
          {filtered.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-border py-16 text-center text-small text-muted-foreground">
              {c.noResults}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filtered.map((series) => (
                <SeriesCard key={series.slug} series={series} lang={lang} />
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer lang={lang} />
    </>
  )
}