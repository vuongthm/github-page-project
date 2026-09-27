"use client"

import { notFound } from "next/navigation"
import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { useState, useEffect, useMemo } from "react"
import { Clock, ArrowLeft, Lock, Unlock, KeyRound } from "lucide-react"
import { ModernHeader as Header } from "@/components/layout/modern-header"
import { Footer } from "@/components/layout/footer"
import { ReadingProgress } from "@/components/features/reading-progress"
import { ShareButton } from "@/components/features/share-button"
import { extractTocItems } from "@/components/features/table-of-contents"
import { ProseContent } from "@/components/content/prose-content"
import { TableOfContents as InlineToc } from "@/components/content/toc"
import { NoteCard } from "@/components/content/note-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useVault } from "@/lib/use-vault"
import { VaultPlaceholder } from "@/components/features/vault-placeholder"
import { ChipLink } from "@/components/ui/chip"
import { cn } from "@/lib/utils" // Import class merging utility to resolve ReferenceError
import { getNoteBySlug, getRelatedNotes, formatDate, estimateReadingTime, type Lang } from "@/lib/data"

interface NotePageClientProps {
  slug: string
  lang: Lang
}

export default function NotePageClient({ slug, lang }: NotePageClientProps) {
  const note = getNoteBySlug(slug, lang)

  // State management for decryption form. Hooks run before the `notFound()`
  // guard below — an early return above them would change the hook count
  // between renders.
  const [password, setPassword] = useState("")
  const [decryptedText, setDecryptedText] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)

  const fallbackVaultKeys = useMemo(() => [`unlock-note-${slug}`], [slug])
  const vault = useVault({
    cacheKey: `note-${slug}`,
    fallbackKeys: fallbackVaultKeys,
    locked: note?.isLocked ?? false,
  })
  const lockedPayloads = useMemo(() => (note ? [note.content] : []), [note])

  if (!note) notFound()

  // Labels for multi-language display
  const LABELS = {
    en: { 
      backToNotes: "All Notes", 
      relatedPosts: "Related posts", 
      minRead: "min read", 
      lockedTitle: "Private Note",
      lockedDesc: "This note is encrypted and private. Please enter the correct password to unlock and read its content.",
      placeholder: "Enter password...",
      unlockBtn: "Unlock Note",
      wrongPassword: "Incorrect password. Please try again."
    },
    vi: { 
      backToNotes: "Tất cả ghi chú", 
      relatedPosts: "Bài liên quan", 
      minRead: "phút đọc", 
      lockedTitle: "Ghi chú riêng tư",
      lockedDesc: "Nội dung ghi chú này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và đọc nội dung.",
      placeholder: "Nhập mật khẩu...",
      unlockBtn: "Mở khóa",
      wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
    },
  }
  const L = LABELS[lang]

  // Resume a previous session so a reload keeps the note readable.
  useEffect(() => {
    if (!note.isLocked) return

    let cancelled = false

    void (async () => {
      const restored = await vault.restore(lockedPayloads)
      if (!restored || cancelled) return

      const [value] = (await vault.decrypt(lockedPayloads)) ?? []
      if (!value || cancelled) return

      setDecryptedText(value)
      setIsUnlocked(true)
    })()

    return () => {
      cancelled = true
    }
    // `vault` exposes stable callbacks, and `lockedPayloads` is memoised.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.isLocked, lockedPayloads])

  // Decryption handler
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || vault.busy) return

    const ok = await vault.unlock(password, lockedPayloads)
    const [value] = ok ? ((await vault.decrypt(lockedPayloads)) ?? []) : []

    if (!value) {
      setError(true)
      toast.error(L.wrongPassword)
      return
    }

    setDecryptedText(value)
    setIsUnlocked(true)
    setError(false)
    setPassword("")
    toast.success(lang === "en" ? "Note unlocked" : "Đã mở khóa ghi chú")
  }

  const related = getRelatedNotes(note, 3)
  
  // Use decrypted text if unlocked, otherwise use raw note content (for unlocked public notes)
  const displayContent = note.isLocked ? (decryptedText ?? "") : note.content
  const tocItems = extractTocItems(displayContent)
  const readingTime = estimateReadingTime(displayContent)

  return (
    <>
      <Header />
      <ReadingProgress />
      <main className="pt-14">
        <Container>
          
          {/* Render password prompt form if the note is locked and not yet unlocked */}
          {/* While the stored session is checked, show a neutral placeholder rather
              than the padlock, so an already-unlocked note never flashes the lock. */}
          {note.isLocked && vault.restoring ? (
            <VaultPlaceholder lang={lang} />
          ) : note.isLocked && !isUnlocked ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto py-12 px-4">
              <div className="size-16 rounded-[var(--radius-lg)] bg-muted border border-border flex items-center justify-center text-accent-brand mb-6 shadow-xs animate-bounce">
                <Lock size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground text-center mb-3">
                {L.lockedTitle}
              </h1>
              <p className="text-small text-muted-foreground text-center leading-relaxed mb-8">
                {L.lockedDesc}
              </p>
              
              <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
                <div className="relative w-full">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={L.placeholder}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-[var(--radius-lg)] border bg-surface text-foreground placeholder:text-muted-foreground text-small outline-none focus:ring-2 transition-[color,background-color,border-color,box-shadow,opacity,transform]",
                      error 
                        ? "border-destructive focus:ring-destructive/20" 
                        : "border-border focus:ring-accent-brand/30 focus:border-accent-brand/60"
                    )}
                    required
                  />
                </div>
                <Button type="submit" variant="default" className="h-11 rounded-[var(--radius-lg)] text-small font-medium w-full flex items-center gap-2 cursor-pointer bg-accent-brand hover:opacity-95 border-0">
                  <Unlock size={14} />
                  {L.unlockBtn}
                </Button>
              </form>
              
              <Link href="/notes" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground transition-colors mt-8">
                <ArrowLeft size={13} /> {L.backToNotes}
              </Link>
            </div>
          ) : (
            
            /* Render standard reading view when unlocked */
            <div className="flex gap-12 py-8 sm:py-12">
              <article className="flex-1 min-w-0">
                <div className="h-10 lg:hidden" aria-hidden="true" />
                <Link href="/notes" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground transition-colors mb-8">
                  <ArrowLeft size={13} /> {L.backToNotes}
                </Link>

                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight flex-1">{note.title}</h1>
                    {note.isLocked && (
                      <span className="shrink-0 size-7 rounded-full bg-accent-brand/10 border border-accent-brand/20 flex items-center justify-center text-accent-brand" title="Encrypted note">
                        <Unlock size={13} />
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">{note.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <time dateTime={note.date}>{formatDate(note.date, lang)}</time>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {readingTime} {L.minRead}</span>
                  </div>
                </header>

                <div className="border-t border-border mb-8" />
                <InlineToc items={tocItems} lang={lang} />
                <ProseContent content={displayContent} />

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <ChipLink key={tag} href={`/tags/${tag}`}>
                        {tag}
                      </ChipLink>
                    ))}
                  </div>
                  <ShareButton title={note.title} lang={lang} />
                </div>

                {related.length > 0 && (
                  <section className="mt-12">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{L.relatedPosts}</h2>
                    <div>
                      {related.map((item) => (
                        <NoteCard key={item.slug} note={item} lang={lang} variant="compact" />
                      ))}
                    </div>
                  </section>
                )}
              </article>

              {tocItems.length > 0 && (
                <aside className="hidden lg:block w-56 shrink-0">
                  <div className="sticky top-24">
                  </div>
                </aside>
              )}
            </div>
          )}
        </Container>
      </main>
      <Footer lang={lang} />
    </>
  )
}