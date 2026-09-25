"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createVault, readSalt, isEncrypted } from "@/lib/crypto.mjs"

/**
 * Client-side vault controller.
 *
 * Before this hook existed, three components each reimplemented the same flow:
 * read a password from `sessionStorage`, decrypt with crypto-js, swallow
 * errors. They also stored the **plaintext password** with no expiry and had
 * no protection at all against scripted brute force.
 *
 * This hook is now the single implementation:
 *   - AES-256-GCM + PBKDF2-SHA256 (600k iterations) via `lib/crypto.mjs`
 *   - the key is derived once per unlock and cached in memory
 *   - the session password expires instead of living until the tab closes
 *   - failed attempts back off exponentially, which is the only rate limit
 *     available to a site that has no server
 */

/** How long an unlocked session stays valid. */
export const VAULT_SESSION_TTL_MS = 6 * 60 * 60 * 1000

const SESSION_PREFIX = "vuong:vault:"
const BASE_DELAY_MS = 300
const MAX_DELAY_MS = 4_000

interface StoredSession {
  password: string
  expiresAt: number
}

type Vault = Awaited<ReturnType<typeof createVault>>

/**
 * Derived keys are cached for the lifetime of the page load.
 *
 * PBKDF2 with 600,000 iterations costs a few hundred milliseconds — very
 * noticeable on a low-power CPU. The vault used to live only in a component
 * ref, which is cleared on unmount, so every navigation back to a protected
 * page re-derived the key and the reader watched the lock screen flash before
 * the content appeared. Keyed by salt, because one vault has exactly one salt.
 */
const vaultCache = new Map<string, { password: string; vault: Vault }>()

function sessionKey(cacheKey: string) {
  return `${SESSION_PREFIX}${cacheKey}`
}

function readStoredSession(cacheKey: string): StoredSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(sessionKey(cacheKey))
    if (!raw) return null

    let parsed: StoredSession
    try {
      parsed = JSON.parse(raw) as StoredSession
    } catch {
      // Legacy format: the old implementation stored the raw password string.
      // Migrate it forward instead of forcing the reader to type it again.
      const legacy: StoredSession = { password: raw, expiresAt: Date.now() + VAULT_SESSION_TTL_MS }
      window.sessionStorage.setItem(sessionKey(cacheKey), JSON.stringify(legacy))
      return legacy
    }

    if (!parsed?.password || typeof parsed.expiresAt !== "number") return null
    if (parsed.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(sessionKey(cacheKey))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStoredSession(cacheKey: string, password: string) {
  if (typeof window === "undefined") return
  try {
    const session: StoredSession = { password, expiresAt: Date.now() + VAULT_SESSION_TTL_MS }
    window.sessionStorage.setItem(sessionKey(cacheKey), JSON.stringify(session))
  } catch {
    /* storage unavailable — the in-memory vault still works for this page */
  }
}

function clearStoredSession(cacheKey: string) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(sessionKey(cacheKey))
  } catch {
    /* ignore */
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The salt is embedded in each payload, so the first ciphertext defines the vault. */
function saltFrom(payloads: string[]): string | null {
  for (const payload of payloads) {
    if (isEncrypted(payload)) return readSalt(payload)
  }
  return null
}

export interface VaultController {
  /** True while PBKDF2 is running; the submit button should be disabled. */
  busy: boolean
  /**
   * True while the stored session is being checked.
   *
   * Starts as `true` for locked content and becomes `false` once `restore()`
   * settles. Rendering the lock form during this window is what made an already
   * unlocked page flash the padlock before showing the content, so consumers
   * should render a neutral placeholder while it is set.
   */
  restoring: boolean
  /** Consecutive failed attempts, reset to 0 on success. */
  failures: number
  /** True after a failure, so the UI can tell the user to slow down. */
  throttled: boolean
  /** Decrypts using the password currently held in memory. */
  decrypt: (payloads: string[]) => Promise<string[] | null>
  /** Verifies a password, memoises the key, and persists the session on success. */
  unlock: (password: string, payloads: string[]) => Promise<boolean>
  /** Tries to resume a previous session. Resolves to the password or null. */
  restore: (payloads: string[]) => Promise<string | null>
  /** Forgets the password and clears the stored session. */
  lock: () => void
}

export interface UseVaultOptions {
  /** Unique per protected resource, e.g. `note-osi-model`. */
  cacheKey: string
  /** Older cache keys to migrate from when a resource is renamed. */
  fallbackKeys?: string[]
  /**
   * Whether this resource is actually protected. Drives the initial
   * `restoring` value, so an unprotected page never shows a placeholder.
   */
  locked?: boolean
}

export function useVault({
  cacheKey,
  fallbackKeys = [],
  locked = true,
}: UseVaultOptions): VaultController {
  const [busy, setBusy] = useState(false)
  const [failures, setFailures] = useState(0)
  const [throttled, setThrottled] = useState(false)

  // Server and client agree on this initial value because `locked` comes from
  // the content data, so there is no hydration mismatch.
  const [restoring, setRestoring] = useState(locked)

  const vaultRef = useRef<Vault | null>(null)
  const failuresRef = useRef(0)

  // Drop the in-memory key when navigating to a different protected resource.
  useEffect(() => {
    return () => {
      vaultRef.current = null
    }
  }, [cacheKey])

  const decrypt = useCallback(async (payloads: string[]): Promise<string[] | null> => {
    const vault = vaultRef.current
    if (!vault) return null

    const out: string[] = []
    for (const payload of payloads) {
      const value = await vault.decrypt(payload)
      if (value === null) return null
      out.push(value)
    }
    return out
  }, [])

  /**
   * Builds a vault and verifies it against every payload before committing.
   * A wrong password must never leave a broken vault in the cache, otherwise
   * later `decrypt()` calls fail silently for the rest of the session.
   */
  const applyPassword = useCallback(async (password: string, payloads: string[]) => {
    const salt = saltFrom(payloads)
    if (!salt) return null

    // Reuse the key derived earlier in this page load when the password matches.
    const cached = vaultCache.get(salt)
    if (cached && cached.password === password) {
      vaultRef.current = cached.vault
      return cached.vault
    }

    const vault = await createVault(password, salt)

    for (const payload of payloads) {
      if ((await vault.decrypt(payload)) === null) return null
    }

    vaultCache.set(salt, { password, vault })
    vaultRef.current = vault
    return vault
  }, [])

  const unlock = useCallback(
    async (password: string, payloads: string[]): Promise<boolean> => {
      const trimmed = password.trim()
      if (!trimmed) return false

      setBusy(true)
      setThrottled(false)

      // Exponential backoff applied before each retry. A human barely notices
      // 300 ms; a script trying thousands of guesses is stopped cold.
      const attempt = failuresRef.current
      if (attempt > 0) {
        await sleep(Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1)))
      }

      try {
        const vault = await applyPassword(trimmed, payloads)
        if (!vault) {
          failuresRef.current = attempt + 1
          setFailures(failuresRef.current)
          setThrottled(true)
          return false
        }

        failuresRef.current = 0
        setFailures(0)
        setThrottled(false)
        writeStoredSession(cacheKey, trimmed)
        return true
      } finally {
        setBusy(false)
      }
    },
    [applyPassword, cacheKey],
  )

  const restore = useCallback(
    async (payloads: string[]): Promise<string | null> => {
      try {
        for (const key of [cacheKey, ...fallbackKeys]) {
          const session = readStoredSession(key)
          if (!session) continue

          setBusy(true)
          try {
            const vault = await applyPassword(session.password, payloads)
            if (vault) {
              // Migrate the session forward so renamed resources keep working.
              if (key !== cacheKey) writeStoredSession(cacheKey, session.password)
              return session.password
            }
          } finally {
            setBusy(false)
          }

          clearStoredSession(key)
        }

        return null
      } finally {
        // Always leave the "checking" state, on every path.
        setRestoring(false)
      }
    },
    [applyPassword, cacheKey, fallbackKeys],
  )

  const lock = useCallback(() => {
    vaultRef.current = null
    failuresRef.current = 0
    setFailures(0)
    setThrottled(false)
    clearStoredSession(cacheKey)
  }, [cacheKey])

  // Safety net: a consumer that never calls `restore()` must not leave the page
  // stuck on the placeholder forever.
  useEffect(() => {
    if (!restoring) return
    const timer = setTimeout(() => setRestoring(false), 2500)
    return () => clearTimeout(timer)
  }, [restoring])

  return { busy, restoring, failures, throttled, decrypt, unlock, restore, lock }
}

