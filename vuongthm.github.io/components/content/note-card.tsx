import { Link } from "@/components/ui/link"
import { Chip } from "@/components/ui/chip"
import { Clock, ArrowRight } from "lucide-react"
import type { Note, Lang } from "@/lib/data"
import { formatDate } from "@/lib/data"
import { cn } from "@/lib/utils"

interface NoteCardProps {
  note: Note
  lang?: Lang
  className?: string
  variant?: "default" | "compact"
}

export function NoteCard({
  note,
  lang = "en",
  className,
  variant = "default",
}: NoteCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/notes/${note.slug}`}
        className={cn(
          "group -mx-3 flex items-start justify-between gap-4 rounded-lg border-b border-border px-3 py-4 last:border-0",
          "transition-colors duration-150 hover:bg-muted/50",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          {/* Sans-serif here on purpose: these are dense list rows, and a serif
              at 14 px scans more slowly than it does at heading sizes. */}
          <h3 className="font-sans text-small font-medium leading-snug text-pretty text-foreground transition-colors duration-150 group-hover:text-accent-brand">
            {note.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-2 text-caption text-muted-foreground">
            <span>{formatDate(note.date, lang)}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {note.readingTime} {lang === "en" ? "min" : "phút"}
            </span>
          </p>
        </div>

        <ArrowRight
          size={14}
          className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent-brand"
        />
      </Link>
    )
  }

  return (
    <Link
      href={`/notes/${note.slug}`}
      className={cn(
        "group block rounded-[var(--radius-lg)] border-b border-border py-5 last:border-0",
        "transition-colors duration-150 hover:bg-muted/40 -mx-4 px-4",
        className,
      )}
    >
      <h3 className="mb-1.5 text-h3 text-pretty text-foreground transition-colors duration-150 group-hover:text-accent-brand">
        {note.title}
      </h3>
      <p className="mb-4 line-clamp-2 text-small leading-relaxed text-muted-foreground">
        {note.description}
      </p>

      {/* Meta row: stacks on a narrow screen so the date and the tags never
          fight for the same line. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 items-center gap-2 text-caption text-muted-foreground">
          <span className="whitespace-nowrap">{formatDate(note.date, lang)}</span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock size={10} />
            {note.readingTime} {lang === "en" ? "min" : "phút"}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
          {/* Plain chips, not links: the whole card is already an <a>, and an
              anchor inside an anchor is invalid HTML that breaks hydration. */}
          {note.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </div>
    </Link>
  )
}