"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Lock, Unlock, KeyRound, ArrowLeft } from "lucide-react"
import { Link } from "@/components/ui/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useVault } from "@/lib/use-vault"
import { VaultPlaceholder } from "@/components/features/vault-placeholder"

interface LockedScreenProps {
  isLocked: boolean
  cacheKey: string
  fallbackKeys?: string[]
  encryptedData: string | Record<string, string>
  onUnlock: (decrypted: any) => void
  backLink: string
  backLabel: string
  lang: "en" | "vi"
  children: React.ReactNode
}

const LABELS = {
  en: {
    lockedTitle: "Private Content",
    lockedDesc: "This content is encrypted and private. Please enter the correct password to unlock and read its content.",
    placeholder: "Enter password...",
    unlockBtn: "Unlock Content",
    wrongPassword: "Incorrect password. Please try again."
  },
  vi: {
    lockedTitle: "Nội dung riêng tư",
    lockedDesc: "Nội dung này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và xem chi tiết.",
    placeholder: "Nhập mật khẩu...",
    unlockBtn: "Mở khóa",
    wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
  }
}

export function LockedScreen({
  isLocked,
  cacheKey,
  fallbackKeys = [],
  encryptedData,
  onUnlock,
  backLink,
  backLabel,
  lang,
  children
}: LockedScreenProps) {
  const L = LABELS[lang]
  const [password, setPassword] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const vault = useVault({ cacheKey, fallbackKeys, locked: isLocked })

  // The gate accepts either a single ciphertext or a keyed dictionary of them
  // (the album page needs the dictionary so each field can be restored in place).
  const payloads = useMemo(
    () => (typeof encryptedData === "string" ? [encryptedData] : Object.values(encryptedData)),
    [encryptedData],
  )

  /** Rebuilds the original shape — a string or a keyed record — from plain values. */
  const toDecryptedShape = useCallback(
    (values: string[]) => {
      if (typeof encryptedData === "string") return values[0]

      const map: Record<string, string> = {}
      Object.keys(encryptedData).forEach((key, index) => {
        map[key] = values[index]
      })
      return map
    },
    [encryptedData],
  )

  // Resume a previous session so a reader is not asked to type the password
  // again after every reload.
  useEffect(() => {
    if (!isLocked) {
      setUnlocked(true)
      return
    }

    let cancelled = false

    void (async () => {
      const restored = await vault.restore(payloads)
      if (!restored || cancelled) return

      const values = await vault.decrypt(payloads)
      if (!values || cancelled) return

      onUnlock(toDecryptedShape(values))
      setUnlocked(true)
    })()

    return () => {
      cancelled = true
    }
    // Only re-run when the protected resource changes; `vault` exposes stable
    // callbacks and `payloads` is derived from `encryptedData`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, cacheKey])

  // Handle password submission and verification
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || vault.busy) return

    const ok = await vault.unlock(password, payloads)
    if (!ok) {
      setError(true)
      toast.error(L.wrongPassword)
      return
    }

    const values = await vault.decrypt(payloads)
    if (!values) {
      setError(true)
      toast.error(L.wrongPassword)
      return
    }

    onUnlock(toDecryptedShape(values))
    setUnlocked(true)
    setError(false)
    setPassword("")
    toast.success(lang === "en" ? "Content unlocked" : "Đã mở khóa nội dung")
  }

  // While the stored session is being checked, show a neutral placeholder
  // instead of the padlock. Rendering the lock form here is what made an
  // already-unlocked page flash the lock icon before the content appeared.
  if (isLocked && vault.restoring) {
    return <VaultPlaceholder lang={lang} />
  }

  if (isLocked && !unlocked) {
    return (
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
        
        <form onSubmit={handleUnlockSubmit} className="w-full flex flex-col gap-3">
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
          <Button type="submit" variant="default" className="h-11 rounded-[var(--radius-lg)] text-small font-medium w-full flex items-center justify-center gap-2 cursor-pointer bg-accent-brand hover:opacity-95 border-0">
            <Unlock size={14} />
            {L.unlockBtn}
          </Button>
        </form>
        
        <Link href={backLink} className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground transition-colors mt-8">
          <ArrowLeft size={13} /> {backLabel}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}