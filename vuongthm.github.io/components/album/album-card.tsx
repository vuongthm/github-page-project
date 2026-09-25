import Image from "next/image"
import { ImageIcon, Video } from "lucide-react"
import { formatDate, type Album, type Lang } from "@/lib/data"
import { cn } from "@/lib/utils"

/**
 * Album tile for the gallery overview.
 *
 * Extracted from the my-album page so the overview can be laid out as a grid
 * (easier to scan and to tap on a phone than the horizontal strip it replaced),
 * and so the media counts are computed in one place.
 */

const LABELS: Record<Lang, { photos: string; videos: string; empty: string }> = {
  en: { photos: "photos", videos: "videos", empty: "No media yet" },
  vi: { photos: "ảnh", videos: "video", empty: "Chưa có ảnh" },
}

interface AlbumCardProps {
  album: Album
  lang: Lang
  /** Highlighted as the album currently being viewed. */
  isSelected?: boolean
  onSelect: (slug: string) => void
  className?: string
}

export function AlbumCard({ album, lang, isSelected = false, onSelect, className }: AlbumCardProps) {
  const L = LABELS[lang]

  // While the gallery is locked, `media` is still ciphertext (a string) until
  // the correct password unlocks it, so the counts are simply unknown.
  const media = Array.isArray(album.media) ? album.media : []
  const photos = media.filter((item) => item.type === "image").length
  const videos = media.length - photos

  return (
    <button
      type="button"
      onClick={() => onSelect(album.slug)}
      aria-pressed={isSelected}
      aria-label={`${album.title} — ${photos} ${L.photos}, ${videos} ${L.videos}`}
      className={cn(
        "group relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] border text-left",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        isSelected
          ? "border-accent-brand ring-2 ring-accent-brand/25"
          : "border-border hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <Image
        src={album.coverImage}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* Media counts, so the tile says what is inside before opening it. */}
      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
        {photos > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 font-mono text-eyebrow text-white backdrop-blur-sm">
            <ImageIcon size={10} />
            {photos}
          </span>
        )}
        {videos > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-0.5 font-mono text-eyebrow text-white backdrop-blur-sm">
            <Video size={10} />
            {videos}
          </span>
        )}
        {media.length === 0 && (
          <span className="rounded-md bg-black/55 px-2 py-0.5 font-mono text-eyebrow text-white/70">
            {L.empty}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="line-clamp-1 font-serif text-small font-semibold text-white">
          {album.title}
        </p>
        <p className="mt-1 font-mono text-eyebrow uppercase tracking-[0.14em] text-white/70">
          {formatDate(album.date, lang)}
        </p>
      </div>
    </button>
  )
}
