import { Link } from "@/components/ui/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { BookOpen, Play } from "lucide-react"
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
        "group relative flex h-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--elevation-3)]",
        className,
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Image
          src={series.coverImage}
          alt={series.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
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

        {/* Overlay card - appears on hover */}
        <div className={cn(
          "absolute inset-0 flex flex-col justify-end p-6",
          "opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0",
          "bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        )}>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">
              {series.title}
            </h3>
            <p className="line-clamp-2 text-sm text-gray-200/90 leading-relaxed">
              {series.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <BookOpen size={12} />
                {series.chapterCount} {CHAPTERS_LABEL[lang]}
              </span>
              <span className="flex flex-wrap gap-1">
                {series.tags.slice(0, 2).map((tag) => (
                  <Chip key={tag} className="text-xs">{tag}</Chip>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}