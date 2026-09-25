import { Link } from "@/components/ui/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { BookOpen } from "lucide-react"
import type { Series, Lang } from "@/lib/data"
import { cn } from "@/lib/utils"

interface SeriesCardProps {
  series: Series
  lang?: Lang
  className?: string
}

const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  ongoing: { en: "Ongoing", vi: "Đang viết" },
  completed: { en: "Completed", vi: "Hoàn thành" },
}

const CHAPTERS_LABEL: Record<Lang, string> = {
  en: "chapters",
  vi: "chương",
}

export function SeriesCard({ series, lang = "en", className }: SeriesCardProps) {
  return (
    <Link
      href={`/stories/${series.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface",
        // Only transform/shadow/border-colour: no layout-affecting properties,
        // so the lift stays on the compositor.
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={series.coverImage}
          alt={series.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className={cn(
              "border-0 text-caption font-medium",
              series.status === "ongoing"
                ? "bg-accent-brand/95 text-accent-brand-foreground"
                : "bg-black/60 text-white",
            )}
          >
            {STATUS_LABELS[series.status][lang]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-h3 text-pretty text-card-foreground transition-colors duration-150 group-hover:text-accent-brand">
          {series.title}
        </h3>

        <p className="mb-5 line-clamp-2 text-small leading-relaxed text-muted-foreground">
          {series.description}
        </p>

        {/* `mt-auto` keeps the meta row pinned to the bottom so cards of
            differing description length still line up in a grid row. */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <BookOpen size={13} />
            {series.chapterCount} {CHAPTERS_LABEL[lang]}
          </span>

          <span className="flex flex-wrap items-center justify-end gap-1.5">
            {series.tags.slice(0, 2).map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </span>
        </div>
      </div>
    </Link>
  )
}