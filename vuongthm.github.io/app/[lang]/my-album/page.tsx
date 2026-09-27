"use client"

import { use, useState, useMemo } from "react"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { ArrowLeft, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Film, Image as ImageIcon } from "lucide-react"
import { ModernHeader as Header } from "@/components/layout/modern-header"
import { Footer } from "@/components/layout/footer"
import { getVisibleAlbums, formatDate, type Album, type AlbumMediaItem } from "@/lib/data"
import { cn } from "@/lib/utils"
import { LockedScreen } from "@/components/features/locked-screen"
import { AlbumCard } from "@/components/album/album-card"
import { Eyebrow } from "@/components/ui/eyebrow"

const LABELS = {
  en: {
    heading: "Visual Memories Hub",
    desc: "A beautifully curated modern space containing family warmth, workspace footprints, and travel records.",
    back: "Back to About",
    overview: "Themes Overview",
    totalMedia: "captures",
    filterAll: "All",
    filterPhotos: "Photos",
    filterVideos: "Videos",
    noMedia: "No photos or videos added to this album yet.",
    prev: "Prev item",
    next: "Next item",
    close: "Close viewer",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    photosHeading: "Album Media Stream",
    photosDesc: "Click on any file to open the cinematic split-screen detailing workspace.",
    showAll: "View All Captures",
    showLess: "Show Less",
  },
  vi: {
    heading: "Bộ sưu tập của tôi",
    desc: "Không gian lưu giữ những hồi ký chân thực nhất về mái ấm gia đình, góc bàn làm việc và muôn nẻo đường đi.",
    back: "Quay lại Về tôi",
    overview: "Bộ sưu tập chủ đề",
    totalMedia: "khoảnh khắc",
    filterAll: "Tất cả",
    filterPhotos: "Ảnh",
    filterVideos: "Video",
    noMedia: "Chưa có hình ảnh hay thước phim nào trong album này.",
    prev: "Ảnh trước",
    next: "Ảnh sau",
    close: "Đóng trình xem",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
    photosHeading: "Kho lưu trữ đa phương tiện",
    photosDesc: "Bấm vào bất kỳ hình ảnh hoặc video nào để mở trình xem chi tiết ký ức.",
    showAll: "Xem tất cả ảnh & video",
    showLess: "Thu gọn",
  }
}

export default function MyAlbumPage({ params }: { params: Promise<{ lang: "en" | "vi" }> }) {
  const { lang } = use(params)
  const L = LABELS[lang]

  // Retrieve raw (possibly encrypted) albums from content data source
  const rawAlbums = useMemo(() => getVisibleAlbums(lang), [lang])
  const isLocked = rawAlbums.some((a) => a.isLocked)

  const [selectedAlbumSlug, setSelectedAlbumSlug] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(6)
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIdx, setModalIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  // Synchronously initialize decryptedAlbums with rawAlbums if the page is not locked
  const [decryptedAlbums, setDecryptedAlbums] = useState<Album[]>(() => {
    return isLocked ? [] : rawAlbums
  })

  // Map all raw album ciphertexts into a single encrypted dictionary for the LockedScreen
  const encryptedDataMap = useMemo(() => {
    const map: Record<string, string> = {}
    rawAlbums.forEach((album) => {
      map[`desc-${album.slug}`] = album.description
      map[`content-${album.slug}`] = album.content
      map[`media-${album.slug}`] = album.media as string
    })
    return map
  }, [rawAlbums])

  // Handle successful decryption of the entire page content
  const handleUnlock = (decryptedMap: Record<string, string>) => {
    const tempAlbums = rawAlbums.map((album) => ({
      ...album,
      description: decryptedMap[`desc-${album.slug}`],
      content: decryptedMap[`content-${album.slug}`],
      media: JSON.parse(decryptedMap[`media-${album.slug}`]) as AlbumMediaItem[]
    }))
    setDecryptedAlbums(tempAlbums)
  }

  // Resolve current active album details
  const activeAlbum = useMemo(() => {
    const targetAlbums = isLocked ? decryptedAlbums : rawAlbums
    if (targetAlbums.length === 0) return null
    if (!selectedAlbumSlug) return targetAlbums[0]
    return targetAlbums.find((a) => a.slug === selectedAlbumSlug) || targetAlbums[0]
  }, [rawAlbums, decryptedAlbums, isLocked, selectedAlbumSlug])

  const allMedia = useMemo(
    () => (activeAlbum?.media as AlbumMediaItem[]) || [],
    [activeAlbum],
  )

  /**
   * The list everything downstream reads: the grid, the "show more" limit, the
   * counter and the lightbox.
   *
   * Filtering in one place means those four can never disagree about which
   * items are currently on screen — previously each derived its own slice.
   */
  const mediaList = useMemo(
    () => (mediaFilter === "all" ? allMedia : allMedia.filter((item) => item.type === mediaFilter)),
    [allMedia, mediaFilter],
  )

  // Open photo/video details modal at selected index
  const openPhotoDetail = (index: number) => {
    setModalIdx(index)
    setZoomed(false)
    setModalOpen(true)
  }

  // Handle previous item navigation in the modal
  const handlePrev = () => {
    setZoomed(false)
    setModalIdx((prev) => (prev - 1 + mediaList.length) % mediaList.length)
  }

  // Handle next item navigation in the modal
  const handleNext = () => {
    setZoomed(false)
    setModalIdx((prev) => (prev + 1) % mediaList.length)
  }

  const renderedAlbums = isLocked ? decryptedAlbums : rawAlbums

  return (
    <>
      <Header />

      <main className="pt-14">
        <Container className="pt-12 pb-[var(--space-section)]">
          
          <LockedScreen
            isLocked={isLocked}
            cacheKey="unlock-my-album"
            encryptedData={encryptedDataMap}
            onUnlock={handleUnlock}
            backLink="/about"
            backLabel={L.back}
            lang={lang}
          >
            <Link
              href="/about"
              className="mb-8 inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              {L.back}
            </Link>

            {/* Heading intro block */}
            <div className="mb-10 text-center sm:text-left">
              <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-pretty text-foreground sm:text-4xl">
                {L.heading}
              </h1>
              <p className="max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">
                {L.desc}
              </p>
            </div>

            {/* === ALBUM OVERVIEW =================================================
                A grid rather than the horizontal strip this used to be. On a
                phone the strip showed barely one album at a time; the grid shows
                four, and every tile is a full-size tap target. Each tile carries
                its photo/video counts so you know what is inside before opening
                it. */}
            <section className="mb-12">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <Eyebrow className="flex items-center gap-2">
                  <ImageIcon size={12} className="text-accent-brand" />
                  {L.overview}
                </Eyebrow>
                <span className="font-mono text-eyebrow text-muted-foreground">
                  {renderedAlbums.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {renderedAlbums.map((album) => (
                  <AlbumCard
                    key={album.slug}
                    album={album}
                    lang={lang}
                    isSelected={activeAlbum?.slug === album.slug}
                    onSelect={(slug) => {
                      setSelectedAlbumSlug(slug)
                      setModalIdx(0)
                      setVisibleLimit(6)
                      // A filter carried over from the previous album could hide
                      // everything in this one, so start each album unfiltered.
                      setMediaFilter("all")
                    }}
                  />
                ))}
              </div>
            </section>

            {/* === KHO ẢNH & VIDEO CHỦ ĐỀ ĐANG CHỌN (100% CHIỀU RỘNG RỘNG RÃI) === */}
            {activeAlbum && (
              <section className="animate-fade-in flex flex-col gap-6">
                
                {/* Giới thiệu chi tiết Album đang chọn */}
                <div className="p-6 rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand">
                      {activeAlbum.slug}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatDate(activeAlbum.date, lang)}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2">
                    {activeAlbum.title}
                  </h2>
                  <p className="text-small text-muted-foreground leading-relaxed text-pretty max-w-3xl">
                    {activeAlbum.description}
                  </p>
                </div>

                {/* Header của kho lưu trữ */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-foreground">
                      {L.photosHeading}
                    </h3>
                    <p className="mt-0.5 hidden text-caption text-muted-foreground sm:block">
                      {L.photosDesc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Type filter. Switches which set the grid *and* the
                        lightbox operate on, so paging stays inside the filter. */}
                    <div
                      role="group"
                      aria-label={L.filterAll}
                      className="flex items-center gap-0.5 rounded-lg border border-border p-0.5"
                    >
                      {(
                        [
                          { key: "all", label: L.filterAll, count: allMedia.length },
                          {
                            key: "image",
                            label: L.filterPhotos,
                            count: allMedia.filter((item) => item.type === "image").length,
                          },
                          {
                            key: "video",
                            label: L.filterVideos,
                            count: allMedia.filter((item) => item.type === "video").length,
                          },
                        ] as const
                      ).map((option) => {
                        const active = mediaFilter === option.key
                        // A filter with nothing behind it is dead weight.
                        if (option.count === 0 && option.key !== "all") return null
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setMediaFilter(option.key)
                              setVisibleLimit(6)
                            }}
                            aria-pressed={active}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-caption font-medium transition-colors duration-150",
                              active
                                ? "bg-accent-brand text-accent-brand-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {option.label}
                            <span className="ml-1.5 font-mono text-eyebrow opacity-70">
                              {option.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <span className="font-mono text-caption text-muted-foreground">
                      {mediaList.length} {L.totalMedia}
                    </span>
                  </div>
                </div>

                {mediaList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-16 text-small">{L.noMedia}</p>
                ) : (
                  <>
                    {/* Grid lưới chứa danh sách tệp đa phương tiện */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {mediaList.slice(0, visibleLimit).map((item, index) => {
                        const isVideo = item.type === "video"
                        return (
                          <div
                            key={item.filename}
                            onClick={() => openPhotoDetail(index)}
                            className="group relative aspect-[4/3] rounded-[var(--radius-lg)] overflow-hidden border border-border bg-muted cursor-pointer hover:border-accent-brand/40 hover:shadow-md transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200"
                          >
                            {isVideo ? (
                              <div className="relative w-full h-full">
                                <video 
                                  src={item.src} 
                                  className="w-full h-full object-cover pointer-events-none"
                                  preload="metadata"
                                />
                                <div className="absolute top-2.5 right-2.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                                  <Film size={11} />
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={item.src}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                unoptimized
                              />
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <p className="text-[10px] text-white/95 leading-tight font-medium font-serif truncate">
                                {item.title}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* === NÚT ĐIỀU HƯỚNG XEM THÊM / THU GỌN === */}
                    {mediaList.length > 6 && (
                      <div className="flex justify-center mt-6 gap-2.5">
                        {visibleLimit < mediaList.length ? (
                          <button
                            onClick={() => setVisibleLimit(mediaList.length)}
                            className="px-5 py-2.5 rounded-[var(--radius-lg)] border border-border bg-surface text-foreground text-[11px] sm:text-small font-semibold hover:bg-muted transition-colors duration-150 cursor-pointer"
                          >
                            {L.showAll}
                          </button>
                        ) : (
                          <button
                            onClick={() => setVisibleLimit(6)}
                            className="px-5 py-2.5 rounded-[var(--radius-lg)] border border-border bg-surface text-foreground text-[11px] sm:text-small font-semibold hover:bg-muted transition-colors duration-150 cursor-pointer"
                          >
                            {L.showLess}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </LockedScreen>

        </Container>
      </main>

      {/* === SPLIT SCREEN CINEMATIC LIGHTBOX MODAL === */}
      {modalOpen && mediaList.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] md:h-[75vh] bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden shadow-2xl z-10">
            <div className="grid grid-cols-1 md:grid-cols-5 h-full w-full">
              
              {/* LEFT SIDE PANEL: Text memory details and typographic controls */}
              <div className="md:col-span-2 flex flex-col justify-between p-6 sm:p-8 bg-surface border-b md:border-b-0 md:border-r border-border h-[40%] md:h-full overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand text-[10px] font-mono font-semibold uppercase tracking-wider">
                      {activeAlbum?.slug}
                    </span>
                    <time className="text-[11px] text-muted-foreground block font-mono">
                      {mediaList[modalIdx].date}
                    </time>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-snug mb-3">
                    {mediaList[modalIdx].title}
                  </h2>
                  
                  <div className="w-12 h-[2px] bg-accent-brand/40 mb-5" />

                  <p className="text-small sm:text-base text-muted-foreground leading-relaxed text-pretty">
                    {mediaList[modalIdx].note}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 pt-6 border-t border-border mt-6">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      className="size-10 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-[color,background-color,border-color,box-shadow,opacity,transform] cursor-pointer"
                      aria-label={L.prev}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[11px] text-muted-foreground font-mono px-1">
                      {modalIdx + 1} / {mediaList.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="size-10 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-[color,background-color,border-color,box-shadow,opacity,transform] cursor-pointer"
                      aria-label={L.next}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {mediaList[modalIdx].type === "image" && (
                      <button
                        onClick={() => setZoomed((z) => !z)}
                        className="size-10 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-[color,background-color,border-color,box-shadow,opacity,transform] cursor-pointer"
                        title={zoomed ? L.zoomOut : L.zoomIn}
                      >
                        {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => setModalOpen(false)}
                      className="size-10 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-[color,background-color,border-color,box-shadow,opacity,transform] cursor-pointer font-mono font-bold"
                      title={L.close}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL: Full size viewport image/video */}
              <div className="md:col-span-3 h-[60%] md:h-full relative bg-black/95 overflow-hidden flex items-center justify-center">
                {mediaList[modalIdx].type === "video" ? (
                  <video
                    src={mediaList[modalIdx].src}
                    controls
                    className="w-full h-full object-contain rounded-r-2xl"
                    preload="auto"
                    autoPlay
                  />
                ) : (
                  <div 
                    onClick={() => setZoomed((z) => !z)}
                    className={cn(
                      "relative w-full h-full transition-transform duration-300 select-none",
                      zoomed ? "scale-140 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                    )}
                  >
                    <Image
                      src={mediaList[modalIdx].src}
                      alt={mediaList[modalIdx].title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </>
  )
}